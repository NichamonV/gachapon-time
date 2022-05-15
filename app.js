require("dotenv").config({ path: "./.env" });
require("./config/database").connext();

const express = require("express");
const app = express();
const userRoute = require("./route/user");
const adminRoute = require("./route/admin");
const webhookBankRoute = require("./route/webhook");

app.use(express.json());

app.use("/user", userRoute);

app.use("/admin", adminRoute);

app.use("/webhook", webhookBankRoute);

module.exports = app;
