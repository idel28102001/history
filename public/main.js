/*global UIkit, Vue */

(() => {
  let token, client, userId;
  const notification = (config) =>
    UIkit.notification({
      pos: "top-right",
      timeout: 5000,
      ...config,
    });

  const alert = (message) => notification({ message, status: "danger" });

  const info = (message) => notification({ message, status: "success" });

  const fetchJson = (...args) =>
    fetch(...args)
      .then((res) =>
        res.ok
          ? res.status !== 204
            ? res.json()
            : null
          : res.text().then((text) => {
              throw new Error(text);
            })
      )
      .catch((err) => {
        alert(err.message);
      });

  new Vue({
    el: "#app",
    data: {
      postSome: "",
      posts: [],
      currId: "",
    },
    methods: {
      makePost() {
        const description = this.postSome;
        this.postSome = "";
        fetchJson("/api/post", {
          method: "post",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ description }),
        }).then(({ _id }) => {
          info(`Your history successfully posted`);
          client.send(JSON.stringify({ type: "new_post", _id, userId }));
        });
      },
      getTime(time) {
        const currTime = new Date(time).toString();
        return `${currTime.slice(4, 15)} ${currTime.slice(16, 21)}`;
      },
      deletePost(btn) {
        if (confirm("Вы уверены удалить?")) {
          try {
            const _id = btn.path[3].children[0].textContent;
            // client.send(JSON.stringify({ userId, _id, type: "delete" }));
            fetchJson(`/api/posts/${_id}`, {
              method: "delete",
              headers: {
                "Content-Type": "application/json",
              },
            }).then((e) => {
              client.send(JSON.stringify({ type: "delete", postId: e }));
            });
          } catch (err) {
            console.error(err);
          }
        }
      },
      changePost(btn) {
        const area = btn.path[3];
        const textArea = area.children[3];
        const oldText = textArea.textContent;
        const postId = area.children[0].textContent;
        textArea.setAttribute("contenteditable", true);
        textArea.focus();

        const btns = document.createElement("div");
        const change = document.createElement("button");
        const cancel = document.createElement("button");

        btns.classList.add("btns-change");
        change.classList.add("btns-change__change");
        cancel.classList.add("btns-change__cancel");

        change.type = "button";
        change.type = "button";

        change.textContent = "Сохранить";
        cancel.textContent = "Отмена";

        btns.append(change, cancel);

        area.append(btns);

        change.addEventListener("click", () => {
          textArea.removeAttribute("contenteditable");
          btns.remove();
          fetchJson(`/api/posts/${postId}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ description: textArea.textContent }),
          }).then((e) => {
            e.type = "change";
            client.send(JSON.stringify(e));
          });
        });
        cancel.addEventListener("click", () => {
          textArea.textContent = oldText;
          textArea.removeAttribute("contenteditable");
          btns.remove();
        });
      },
    },
    created() {
      const wsProto = location.protocol === "https:" ? "wss:" : "ws:";
      client = new WebSocket(`${wsProto}//${location.host}`);
      token = window.AUTH_TOKEN;
      userId = window.USER_ID;
      client.addEventListener("open", () => {
        client.addEventListener("message", async (message) => {
          let data;
          try {
            data = JSON.parse(message.data);
          } catch (err) {
            return;
          }
          switch (data.type) {
            case "all_posts": {
              this.posts = data.allPosts;
              break;
            }
            case "new_post": {
              await fetchJson(`/api/posts/${data.postId}`, {
                method: "get",
                headers: {
                  "Content-Type": "application/json",
                },
              }).then((post) => {
                this.posts.unshift(post);
              });
              break;
            }
            case "delete": {
              this.posts = this.posts.filter((e) => e._id !== data.postId);
              break;
            }
            case "change": {
              this.posts.map((e) => {
                if (e._id === data.postId) {
                  e.description = data.description;
                }
              });
              break;
            }
          }
        });
        fetchJson("/api/posts", {
          method: "get",
          headers: {
            "Content-Type": "application/json",
          },
        }).then((res) => {
          this.posts = res;
        });
        client.send(JSON.stringify({ type: "auth", token, userId }));
      });
    },
  });
})();
