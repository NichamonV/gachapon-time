const config = process.env;
const jwt = require("jsonwebtoken");
const User = require("../model/user");

const verifyToken = async (req, res, next) => {
  const token = req.headers["x-access-token"];
  if (!token) {
    return res.status(403).send("A token is required for authentication");
  }

  try {
    const decode = jwt.verify(token, config.TOKEN_KEY);
    const user = await User.findById(decode.user_id);
    req.user = user;
    if (!req.user) {
      return res.status(403).send("Only user have permission");
    }
  } catch (error) {
    return res.status(401).send("invalid token");
  }

  return next();
};

module.exports = verifyToken;
