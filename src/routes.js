const express = require("express");
const router = express.Router();
const mysql = require("mysql");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const middleware = require("./middleware");
const database = require("./db");

router.get("/", (req, res) => {
  res.send("The API service works!");
});

router.get("/users", (req, res) => {
  database((db) =>
    db.query(`SELECT * FROM users`, (err, result) => {
      if (err) console.log(err);
      res.json(result);
    })
  );
});

router.post("/register", middleware.userValidation, (req, res) => {
  const email = req.body.email;
  database((db) =>
    db.query(
      `SELECT * FROM users WHERE email = ${mysql.escape(email)}`,
      (err, result) => {
        if (err) {
          console.log(err);
          return res
            .status(400)
            .json({ msg: "Internal server error checking email validity" });
        } else if (result.length !== 0) {
          return res
            .status(400)
            .json({ msg: "This email already registered!" });
        } else {
          bcrypt.hash(req.body.password, 7, (err, hash) => {
            if (err) {
              console.log(err);
              return res
                .status(400)
                .json({ msg: "Internal server error hashing email details" });
            } else {
              con.query(
                `INSERT INTO users (email, password, username) VALUES (
                ${mysql.escape(email)},
               ${mysql.escape(hash)},
               'anonymous'
               )`,
                (err, result) => {
                  if (err) {
                    console.log(err);
                    return res.status(400).json({
                      msg: "Internal server error saving your details",
                    });
                  } else {
                    return res
                      .status(201)
                      .json({ msg: "User has been succesfully registered" });
                  }
                }
              );
            }
          });
        }
      }
    )
  );
});

router.post("/login", middleware.userValidation, (req, res) => {
  const email = req.body.email;
  database((db) =>
    db.query(
      `SELECT * FROM users WHERE email = ${mysql.escape(email)}`,
      (err, result) => {
        if (err) {
          console.log(err);
          return res
            .status(400)
            .json({ msg: "Internal server error gathering user details" });
        } else if (result.length !== 1) {
          return res.status(400).json({
            msg:
              "The provided details are incorrect or the user does not exist",
          });
        } else {
          bcrypt.compare(
            req.body.password,
            result[0].password,
            (bErr, bResult) => {
              if (bErr || !bResult) {
                return res.status(400).json({
                  msg:
                    "The provided details are incorrect or the user does not exist",
                });
              } else if (bResult) {
                const token = jwt.sign(
                  {
                    userId: result[0].id,
                    email: result[0].email,
                  },
                  process.env.SECRET_KEY,
                  {
                    expiresIn: "7d",
                  }
                );

                return res.status(200).json({
                  msg: "Logged In",
                  token,
                  userData: {
                    userId: result[0].id,
                    email: result[0].email,
                  },
                });
              }
            }
          );
        }
      }
    )
  );
});

module.exports = router;
