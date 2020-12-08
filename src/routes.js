const express = require("express");
const router = express.Router();
const mysql = require("mysql");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const middleware = require("./middleware");
const con = require("./db");

router.get("/", (req, res) => {
  res.send("The API service works!");
});

module.exports = router;
