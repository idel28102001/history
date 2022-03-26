const bodyParser = require("body-parser");
const express = require("express");
const cookieParser = require("cookie-parser");
const http = require("http");
const { updateUsers, login, auth, clearSession } = require("./logs");

const app = express();
const server = http.createServer(app);
const { MongoClient } = require("mongodb");
const clientPromise = MongoClient.connect(process.env.DB_URI, {
  useUnifiedTopology: true,
  maxPoolSize: 10,
});

app.use(async (req, res, next) => {
  try {
    const client = await clientPromise;
    req.db = client.db("users");
    next();
  } catch (err) {
    next(err);
  }
});

// app.use(express.json());
app.use(cookieParser());
app.use(express.static("public"));
app.set("view engine", "njk");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post("/api/signup", auth(), async (req, res) => {
  const { username, password } = req.body;
  await updateUsers(req.db, username, password, res);
});

app.post("/api/login", auth(), async (req, res) => {
  const { username, password } = req.body;
  await login(req.db, username, password, res);
});

app.get("/logout", auth(), async (req, res) => {
  if (!req.user) {
    return res.redirect("/");
  }
  await clearSession(req.db, req.sessionId, res);
});

app.get("/", auth(), (req, res) => {
  res.render("index", {
    userToken: req.sessionId,
    user: req.user,
    signError: req.query.signError === "true" ? "That username was already taken" : req.query.signError,
    signSuccess: req.query.signSuccess === "true" ? "You are succesfully signed up" : req.query.signSuccess,
    authError: req.query.authError === "true" ? "Wrong login or password" : req.query.authError,
  });
});

module.exports = { server, app };
require("./webSockets");
