const { nanoid } = require("nanoid");
const bcrypt = require("bcrypt");
const { ObjectId } = require("mongodb");

const createUser = async (username, password) => {
  const pass = await bcrypt.hash(password, 10);
  return { username, password: pass };
};

const updateUsers = async (db, user, pass, res) => {
  const { username, password } = await createUser(user, pass);
  const userN = await db.collection("users").findOne({ username }, { projection: { username: 1 } });
  if (!userN) {
    await db.collection("users").insertOne({ username, password });
    res.redirect("/?signSuccess=true");
  } else {
    res.redirect("/?signError=true");
  }
};

const findUserByUserName = async (db, username, res) => {
  try {
    const answer = await db.collection("users").findOne({ username });
    if (!answer) {
      return res.redirect("/?authError=true");
    }
    return answer;
  } catch (err) {
    console.log(err.message);
    return res.redirect("/?authError=true");
  }
};

const createSession = async (db, userId) => {
  const sessionId = nanoid();
  await db.collection("sessions").insertOne({ userId, sessionId });
  return sessionId;
};

const login = async (db, username, password, res) => {
  const user = await findUserByUserName(db, username, res);
  if (!(await bcrypt.compare(password, user.password))) {
    return res.redirect("/?authError=true");
  }
  const sessionId = await createSession(db, user._id);
  res.cookie("sessionId", sessionId, { httpOnly: true }).redirect("/");
};

const findUserByUserSessionId = async (db, sessionId) => {
  const session = await db.collection("sessions").findOne({ sessionId }, { projection: { userId: 1 } });
  if (session) return db.collection("users").findOne({ _id: ObjectId(session.userId) });
};

const auth = () => async (req, res, next) => {
  if (!req.cookies["sessionId"]) {
    return next();
  }
  const user = await findUserByUserSessionId(req.db, req.cookies["sessionId"]);
  if (!user) {
    return next();
  }
  req.user = user;
  req.sessionId = req.cookies["sessionId"];
  next();
};

const clearSession = async (db, sessionId, res) => {
  try {
    await db.collection("sessions").deleteOne({ sessionId });
  } catch (err) {
    console.error(err);
    return res.redirect("/");
  }
  res.clearCookie("sessionId").redirect("/");
};

module.exports = { updateUsers, login, auth, clearSession };
