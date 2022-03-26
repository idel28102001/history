const { server } = require("./loginApp");
const WebSocket = require("ws");
const clients = new Map();
const iterAllClients = (clients, dict) => {
  for (const token of clients.keys()) {
    clients.get(token).send(JSON.stringify(dict));
  }
};

const wss = new WebSocket.Server({ server });
wss.on("connection", (ws) => {
  ws.on("message", async (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch (err) {
      return;
    }
    switch (data.type) {
      case "auth": {
        clients.set(data.token, ws);
        break;
      }
      case "new_post": {
        iterAllClients(clients, { type: "new_post", postId: data._id });
        break;
      }
      case "delete": {
        iterAllClients(clients, { type: "delete", postId: data.postId });
        break;
      }
      case "change": {
        iterAllClients(clients, { type: "change", postId: data._id, description: data.description });
        break;
      }
    }
  });
  ws.on("close", () => {
    for (const [key, value] of clients.entries()) {
      if (value === ws) {
        clients.delete(key);
      }
    }
  });
});
