const express = require("express");
const User = require("../model/user");
const authBank = require("../middleware/auth_bank");
const router = express.Router();

// Payment
router.post("/bank", authBank, async (req, res) => {
  try {
    const { account_id, amount } = req.body;
    await User.findByIdAndUpdate(account_id, { $inc: { coin: amount } });
    res.status(200).send("Success");
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
