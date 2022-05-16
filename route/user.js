const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../model/user");
const UserGacha = require("../model/user_gachapon");
const Admin = require("../model/admin");
const Gacha = require("../model/gachapon");
const auth = require("../middleware/auth");
const jwt = require("jsonwebtoken");
const router = express.Router();

const config = process.env;

function playGachapon(rank, gachas) {
  const rand = Math.floor(Math.random() * 101);
  let item = "";
  switch (rank) {
    case "bronze":
      item = gachaForBronze(gachas, rand);
      break;
    case "silver":
      item = gachaForSilver(gachas, rand);
      break;
    case "gold":
      item = gachaForGold(gachas, rand);
      break;
  }

  return item;
}

function gachaForGold(gachas, rand, item) {
  if (rand <= 80) {
    item = gachas[0.8];
  } else if (rand <= 95) {
    item = gachas[0.15];
  } else if (rand <= 99) {
    item = gachas[0.04];
  } else {
    item = gachas[0.01];
  }
  return item;
}

function gachaForSilver(gachas, rand, item) {
  if (rand <= 80) {
    item = gachas[0.8];
  } else if (rand <= 95) {
    item = gachas[0.15];
  } else {
    item = gachas[0.05];
  }
  return item;
}

function gachaForBronze(gachas, rand, item) {
  if (rand <= 80) {
    item = gachas[0.8];
  } else {
    item = gachas[0.2];
  }
  return item;
}

// Login for user
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    //validate
    if (!(email && password)) {
      return res.status(400).send("All input is required");
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
      return res.status(200).json(user);
    }

    return res.status(400).send("Invalid Credentials");
  } catch (error) {
    return res.status(500).send(error);
  }
});

// Register for user
router.post("/account", async (req, res) => {
  try {
    // get user input
    const { first_name, last_name, email, password } = req.body;
    //validate user input
    if (!(email && password && first_name && last_name)) {
      return res.status(400).send("All input is required");
    }
    //user already exist
    const oldUser = await User.findOne({ email });
    if (oldUser) {
      return res.status(409).send("User already exist. Please login.");
    } else {
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
      return res.status(201).json(user);
    }
  } catch (error) {
    return res.status(500).send(error);
  }
});

// Play gachapon
router.post("/gachapon", auth, async (req, res) => {
  try {
    const { admin_id } = req.body;
    const user = req.user;

    if (user.coin < 20) {
      return res.status(400).send("Need coin for play gachapon");
    }
    const gacha = await Gacha.findOne({ admin: admin_id });
    const admin = await Admin.findById(admin_id);
    let gachas = {};

    // map item and rate
    gacha.items.forEach((element) => {
      gachas[element.rate] = element.title;
    });

    const item = playGachapon(admin.rank, gachas);

    // pay
    await User.findByIdAndUpdate(user._id, { $inc: { coin: -20 } });

    // create user gachapon
    await UserGacha.create({
      user: user._id,
      title: item,
    });

    return res.status(200).send(item);
  } catch (error) {
    return res.status(500).send(error);
  }
});

module.exports = router;
