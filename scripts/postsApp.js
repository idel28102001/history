const { server, app } = require("./loginApp");
const { auth } = require("./logs");
const { createPost, getPosts, getPost, deletePost, changePost } = require("./posts");

app.post("/api/post", auth(), async (req, res) => {
  const { description } = req.body;
  const { _id: id, username } = req.user;
  createPost(req.db, description, id, username, res);
});

app.get("/api/posts", auth(), async (req, res) => {
  const result = await getPosts(req.db, req.user ? req.user._id : null);
  res.send(JSON.stringify(result));
});

app.get("/api/posts/:id", auth(), async (req, res) => {
  const currPost = await getPost(req.db, req.params.id);
  if (currPost.userId.toString() === req.user._id.toString()) {
    currPost.owner = true;
  }
  res.send(JSON.stringify(currPost));
});

app.delete("/api/posts/:id", auth(), async (req, res) => {
  const some = await deletePost(req.db, req.user._id, req.params.id);
  if (some) {
    return res.send(JSON.stringify(some));
  }
  res.status(204).send({});
});

app.patch("/api/posts/:id", auth(), async (req, res) => {
  const { description } = req.body;
  const result = await changePost(req.db, req.user._id, req.params.id, description);
  if (result) {
    return res.send(JSON.stringify(result));
  }
  res.status(204).send({});
});

module.exports = { server, app };
