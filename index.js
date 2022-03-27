require("dotenv").config();
const nunjucks = require("nunjucks");
const { server, app } = require("./scripts/webSockets");

nunjucks.configure("views", {
  autoescape: true,
  express: app,
  tags: {
    blockStart: "[%",
    blockEnd: "%]",
    variableStart: "[[",
    variableEnd: "]]",
    commentStart: "[#",
    commentEnd: "#]",
  },
});

const port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log(`\tListening on http://localhost:${port}`);
});
