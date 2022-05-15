const express = require("express");
const bcrypt = require("bcryptjs");
const Admin = require("../model/admin");
const Gacha = require("../model/gachapon");
const auth = require("../middleware/auth");
const jwt = require("jsonwebtoken");
const router = express.Router();

const config = process.env;

const RANK_RATE = {
  bronze: { N: 0.8, R: 0.2 },
  silver: { N: 0.8, R: 0.15, SR: 0.05 },
  gold: { N: 0.8, R: 0.15, SR: 0.04, UR: 0.01 },
};

function isIncludeRank(items, adminRank) {
  let result = true;
  for (const item of items) {
    if (!Object.keys(RANK_RATE[adminRank]).includes(item.rank)) {
      result = false;
    }
  }
  return result;
}

function getRate(adminRank, gachaRank) {
  return RANK_RATE[adminRank][gachaRank];
}

function genItems(adminRank, items) {
  return items.map((item) => ({
    title: item.title,
    rank: item.rank,
    rate: getRate(adminRank, item.rank),
  }));
}

function rankCounter(items, adminRank) {
  const cntN = items.filter((item) => item.rank == "N").length;
  const cntR = items.filter((item) => item.rank == "R").length;
  const cntSR = items.filter((item) => item.rank == "SR").length;
  const cntUR = items.filter((item) => item.rank == "UR").length;
  let result = false;

  switch (adminRank) {
    case "bronze":
      result = cntN == 1 && cntR == 1;
      break;
    case "silver":
      result = cntN == 1 && cntR == 1 && cntSR == 1;
      break;
    case "gold":
      result = cntN == 1 && cntR == 1 && cntSR == 1 && cntUR == 1;
      break;
  }
  return result;
}

function validateItem(items, adminRank) {
  return rankCounter(items, adminRank) && isIncludeRank(items, adminRank);
}

// Login for admin
router.post("/login", async (req, res) => {
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
    const { items } = req.body;
    const admin = await Admin.findById(admin_id);
    //check permission
    if (admin) {
      //validate input
      if (!(admin_id && items)) {
        return res.status(400).send("All input is required");
      }
      //validate items input
      if (!validateItem(items, admin.rank)) {
        return res.status(400).send("invalid gachapon rank");
      }

      const oldGacha = await Gacha.findOne({
        admin: admin_id,
      });
      // find for replace old
      if (oldGacha) {
        await Gacha.findByIdAndUpdate(
          { _id: oldGacha._id },
          {
            items: genItems(admin.rank, items),
          }
        );
        return res.status(201).send("Update gachapon");
      } else {
        const gacha = await Gacha.create({
          admin: admin_id,
          items: genItems(admin.rank, items),
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
