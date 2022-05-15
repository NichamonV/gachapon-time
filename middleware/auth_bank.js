const config = process.env;

const verifyToken = (req, res, next) => {
  const token = req.headers["x-access-token"];
  if (!token) {
    return res.status(403).send("A token is required for authentication");
  }

  if (token != config.BANK_TOKEN_KEY) {
    return res.status(401).send("Invalid token");
  }

  return next();
};

module.exports = verifyToken;
