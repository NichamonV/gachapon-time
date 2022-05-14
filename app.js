require("dotenv").config({ path: "./.env" });
require("./config/database").connext();

const express = require("express");
const app = express();

app.use(express.json());
