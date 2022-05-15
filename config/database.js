const mongoose = require("mongoose");
const config = process.env;

exports.connext = () => {
  mongoose
    .connect(config.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log("Successfully connected to database");
    })
    .catch((error) => {
      console.log("Error connecting to database");
      console.error(error);
      process.exit(1);
    });
};
