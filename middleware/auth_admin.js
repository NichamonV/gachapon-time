const config = process.env;
const jwt = require("jsonwebtoken");
const Admin = require("../model/admin");

const verifyToken = async (req, res, next) => {
  const token = req.headers["x-access-token"];
  if (!token) {
    return res.status(403).send("A token is required for authentication");
  }

  try {
    const decode = jwt.verify(token, config.TOKEN_KEY);
    const admin = await Admin.findById(decode.admin_id);
    req.user = admin;
    if (!req.user) {
      return res.status(403).send("Only admin have permission");
    }
  } catch (error) {
    return res.status(401).send("invalid token");
  }

  return next();
};

module.exports = verifyToken;
