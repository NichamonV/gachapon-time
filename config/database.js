const mongoose = require("mongoose");

exports.connext = () => {
  mongoose
    .connect("mongodb://localhost:27017", {
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
