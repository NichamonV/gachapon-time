require("dotenv").config({ path: "./.env" });
require("./config/database").connext();

const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("./model/user");
const Admin = require("./model/admin");
const jwt = require("jsonwebtoken");
const app = express();

const config = process.env;

app.use(express.json());

// Login for user
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    //validate
    if (!(email && password)) {
      res.status(400).send("All input is required");
    }

    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      //Create token
      const token = jwt.sign({ user_id: user._id, email }, config.TOKEN_KEY, {
        expiresIn: "2h",
      });

      // save token
      user.token = token;
      // return user
      res.status(200).json(user);
    }

    res.status(400).send("Invalid Credentials");
  } catch (error) {
    console.log(error);
  }
});

// Register for user
app.post("/register", async (req, res) => {
  try {
    // get user input
    const { first_name, last_name, email, password } = req.body;
    //validate user input
    if (!(email && password && first_name && last_name)) {
      res.status(400).send("All input is required");
    }
    //user already exist
    const oldUser = await User.findOne({ email });
    if (oldUser) {
      res.status(409).send("User already exist. Please login.");
    }
    // encrypt password
    encryptedPassword = await bcrypt.hash(password, 10);

    //Create user in database
    const user = await User.create({
      first_name,
      last_name,
      email: email.toLowerCase(),
      password: encryptedPassword,
    });

    //Create token
    const token = jwt.sign({ user_id: user._id, email }, config.TOKEN_KEY, {
      expiresIn: "2h",
    });

    //save user token
    user.token = token;
    // return new user
    res.status(201).json(user);
  } catch (error) {
    console.log(error);
  }
});

// Login for admin
app.post("/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    //validate
    if (!(email && password)) {
      res.status(400).send("All input is required");
    }

    const admin = await Admin.findOne({ email });

    if (admin && (await bcrypt.compare(password, admin.password))) {
      //Create token
      const token = jwt.sign({ admin_id: admin._id, email }, config.TOKEN_KEY, {
        expiresIn: "2h",
      });

      // save token
      admin.token = token;
      // return admin
      res.status(200).json(admin);
    }

    res.status(400).send("Invalid Credentials");
  } catch (error) {
    console.log(error);
  }
});

// Register for admin
app.post("/admin/register", async (req, res) => {
  try {
    // get input
    const { first_name, last_name, email, password, rank } = req.body;

    //validate user input
    if (!(email && password && first_name && last_name && rank)) {
      res.status(400).send("All input is required");
    }
    //admin already exist
    const oldAdmin = await Admin.findOne({ email });
    if (oldAdmin) {
      res.status(409).send("Admin already exist. Please login.");
    }
    // encrypt password
    encryptedPassword = await bcrypt.hash(password, 10);

    //Create admin in database
    const admin = await Admin.create({
      first_name,
      last_name,
      email: email.toLowerCase(),
      password: encryptedPassword,
      rank,
    });

    //Create token
    const token = jwt.sign({ admin_id: admin._id, email }, config.TOKEN_KEY, {
      expiresIn: "2h",
    });

    //save token
    admin.token = token;
    // return new admin
    res.status(201).json(admin);
  } catch (error) {
    console.log(error);
  }
});

module.exports = app;
