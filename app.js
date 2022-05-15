require("dotenv").config({ path: "./.env" });
require("./config/database").connext();

const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("./model/user");
const Admin = require("./model/admin");
const Gacha = require("./model/gachapon");
const auth = require("./middleware/auth");
const authBank = require("./middleware/auth_bank");
const jwt = require("jsonwebtoken");
const app = express();

const config = process.env;
const rankRate = {
  bronze: { N: 0.8, R: 0.2 },
  silver: { N: 0.8, R: 0.15, SR: 0.05 },
  gold: { N: 0.8, R: 0.15, SR: 0.04, UR: 0.01 },
};

function playGachapon(rank, gachas) {
  var rand = Math.floor(Math.random() * 101);
  console.log(rand);
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
    // console.log(obj[0.8]);
    item = gachas[0.8];
  } else if (rand <= 95) {
    // console.log(obj[0.15]);
    item = gachas[0.15];
  } else if (rand <= 99) {
    // console.log(obj[0.04]);
    item = gachas[0.04];
  } else {
    // console.log(obj[0.01]);
    item = gachas[0.01];
  }
  return item;
}

function gachaForSilver(gachas, rand, item) {
  if (rand <= 80) {
    // console.log(obj[0.8]);
    item = gachas[0.8];
  } else if (rand <= 95) {
    // console.log(obj[0.15]);
    item = gachas[0.15];
  } else {
    // console.log(obj[0.05]);
    item = gachas[0.05];
  }
  return item;
}

function gachaForBronze(gachas, rand, item) {
  if (rand <= 80) {
    // console.log(obj[0.8]);
    item = gachas[0.8];
  } else{
    // console.log(obj[0.2]);
    item = gachas[0.2];
  }
  return item;
}

function validateRate(rank, rate) {
  return Object.keys(rankRate[rank]).includes(rate);
}

function getRateNum(rank, rate) {
  return rankRate[rank][rate];
}

app.use(express.json());

// Login for user
app.post("/user/login", async (req, res) => {
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
app.post("/user", async (req, res) => {
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

// play gachapon
app.post("/gachapon", auth, async (req, res) => {
  try {
    const { user_id } = req.user;
    const { admin_id } = req.body;
    const user = await User.findById(user_id);

    if (user.coin <= 20) {
      return res.status(400).send("Need coin for play gachapon");
    }
    const gacha = await Gacha.find({ admin: admin_id });
    const admin = await Admin.findById(admin_id);
    let gachas = {};

    gacha.forEach((element) => {
      gachas[element.rate_number] = element.title;
    });

    const item = playGachapon(admin.rank, gachas);

    

    res.status(200).send(item);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Login for admin
app.post("/admin/account/login", async (req, res) => {
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
app.post("/admin/account", async (req, res) => {
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

// Account admin
app.patch("/admin/account/:id", auth, async (req, res) => {
  try {
    const _id = req.params.id;
    const updateAdmin = await Admin.findByIdAndUpdate(_id, req.body, {
      new: true,
    });
    res.status(200).send(updateAdmin);
  } catch (error) {
    res.status(404).send(error);
  }
});

// create gachapon
app.post("/admin/gacha", auth, async (req, res) => {
  try {
    if (!req.body.username) {
      const { admin_id } = req.user;
      const { title, rate } = req.body;
      const admin = await Admin.findById(admin_id);

      //check permission
      if (admin) {
        //validate user input
        if (!(admin_id && title && rate)) {
          return res.status(400).send("All input is required");
        }

        //validate rate
        if (!validateRate(admin.rank, rate)) {
          return res.status(400).send("invalid rate");
        }

        const oldGacha = await Gacha.findOne({
          admin: admin_id,
          rate_title: rate,
        });

        // find for replace old
        if (oldGacha) {
          await Gacha.findByIdAndUpdate(
            { _id: oldGacha._id },
            { title: title }
          );
          return res.status(201).send("create update");
        } else {
          const gacha = await Gacha.create({
            admin: admin_id,
            title,
            rate_title: rate,
            rate_number: getRateNum(admin.rank, rate),
          });
          return res.status(201).json(gacha);
        }
      }
      return res.status(403).send("Only admin have permission");
    }
  } catch (error) {
    console.log(error);
  }
});

// Payment
app.post("/webhook/bank", authBank, async (req, res) => {
  try {
    const { account_id, amount } = req.body;
    await User.findByIdAndUpdate(accountID, { $inc: { coin: amount } });
    res.status(200).send("Success");
  } catch (error) {
    res.status(404).send(error);
  }
});

module.exports = app;
