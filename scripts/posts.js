const { ObjectId } = require("mongodb");
const createPost = async (db, descr, userId, username, res) => {
  const some = await db.collection("posts").insertOne({ description: descr, userId, username, datePosted: Date.now() });
  if (some.insertedId) {
    return res.send({ _id: some.insertedId });
  }
  res.send({ _id: some });
};

const getPosts = async (db, userId) => {
  const allPosts = await db.collection("posts").find().toArray();
  allPosts.reverse();
  allPosts.map((e) => {
    e.owner = e.userId.toString() === userId.toString();
  });
  return allPosts;
};

const getPost = async (db, _id) => {
  const post = await db.collection("posts").findOne({ _id: ObjectId(_id) });
  return post;
};

const findUserIdByPostId = async (db, _id) => {
  const element = await db.collection("posts").findOne({ _id: ObjectId(_id) });
  if (element) {
    return element.userId;
  }
};

const checkRightsOnPost = async (db, userId, _id) => {
  const postUserId = await findUserIdByPostId(db, _id);
  return postUserId.toString() === userId.toString();
};

const deletePost = async (db, userId, postId) => {
  const postUserId = await checkRightsOnPost(db, userId, postId);
  if (postUserId) {
    try {
      const some = await db.collection("posts").deleteOne({ _id: ObjectId(postId) });
      if (some.deletedCount) {
        return postId;
      }
    } catch (err) {
      return console.error(err);
    }
  }
};

const changePost = async (db, userId, postId, description) => {
  const postUserId = await checkRightsOnPost(db, userId, postId);
  if (postUserId) {
    try {
      const some = await db
        .collection("posts")
        .findOneAndUpdate({ _id: ObjectId(postId) }, { $set: { description } }, { returnOriginal: false });
      if (some.value) {
        return { _id: some.value._id, description };
      }
      return null;
    } catch (err) {
      return console.error(err);
    }
  }
};

module.exports = { createPost, getPosts, getPost, deletePost, changePost };
