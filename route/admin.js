const express = require("express");
const bcrypt = require("bcryptjs");
const Admin = require("../model/admin");
const Gacha = require("../model/gachapon");
const auth = require("../middleware/auth");
const jwt = require("jsonwebtoken");
const router = express.Router();

const config = process.env;

const rankRate = {
  bronze: { N: 0.8, R: 0.2 },
  silver: { N: 0.8, R: 0.15, SR: 0.05 },
  gold: { N: 0.8, R: 0.15, SR: 0.04, UR: 0.01 },
};

function validateRate(rank, rate) {
  return Object.keys(rankRate[rank]).includes(rate);
}

function getRateNum(rank, rate) {
  return rankRate[rank][rate];
}

// Login for admin
router.post("/account/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    //validate
    if (!(email && password)) {
      return res.status(400).send("All input is required");
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
      return res.status(200).json(admin);
    }

    return res.status(400).send("Invalid Credentials");
  } catch (error) {
    return res.status(404).send(error);
  }
});

// Register for admin
router.post("/account", async (req, res) => {
  try {
    // get input
    const { first_name, last_name, email, password, rank } = req.body;

    //validate user input
    if (!(email && password && first_name && last_name && rank)) {
      return res.status(400).send("All input is required");
    }
    //admin already exist
    const oldAdmin = await Admin.findOne({ email });
    if (oldAdmin) {
      return res.status(409).send("Admin already exist. Please login.");
    } else {
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
      return res.status(201).json(admin);
    }
  } catch (error) {
    console.log(error)
    return res.status(404).send(error);
  }
});

// Account admin
router.patch("/account/:id", auth, async (req, res) => {
  try {
    const _id = req.params.id;
    const updateAdmin = await Admin.findByIdAndUpdate(_id, req.body, {
      new: true,
    });
    return res.status(200).send(updateAdmin);
  } catch (error) {
    return res.status(404).send(error);
  }
});

// create gachapon
router.post("/gacha", auth, async (req, res) => {
  try {
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
        await Gacha.findByIdAndUpdate({ _id: oldGacha._id }, { title: title });
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
  } catch (error) {
    return res.status(404).send(error);
  }
});

module.exports = router;
