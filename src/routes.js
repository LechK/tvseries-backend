const express = require("express");
const router = express.Router();
const mysql = require("mysql");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const middleware = require("./middleware");
const database = require("./db");

//GET SHOW ID ON SELECTEDSHOW PAGE
router.get("/shows/:id", (req, res) => {
  database((db) =>
    db.query(
      `SELECT * FROM tv_series WHERE id = ${mysql.escape(req.params.id)}`,
      (err, result) => {
        if (err) console.log(err);
        res.json(result);
      }
    )
  );
});

//GET ALL SEASONS BY SHOW ID
router.get("/shows/:id/seasons", (req, res) => {
  database((db) =>
    db.query(
      `SELECT * FROM seasons WHERE tv_series_id = ${mysql.escape(
        req.params.id
      )}`,
      (err, result) => {
        if (err) console.log(err);
        res.json(result);
      }
    )
  );
});

// GET ALL EPISODES BY SEASON ID
router.get("/shows/id/seasons/:seasonId/episodes/", (req, res) => {
  database((db) =>
    db.query(
      `SELECT * FROM episodes WHERE season_id = ${mysql.escape(
        req.params.seasonId
      )}`,
      (err, result) => {
        if (err) {
          console.log(err);
        } else {
          return res.json(result);
        }
      }
    )
  );
});

//GET CHARACTERS BY APPEARENCE AT SELECTED EPISODE
router.get("/shows/:id/seasons/:seasonId/episodes/:episodeNum", (req, res) => {
  database((db) =>
    db.query(
      `SELECT ch.id, ch.fullname, ch.appeared_at, ch.vanished_at, ch.photo FROM characters AS ch
      JOIN episodes ON episodes.tv_series_id = ch.tv_series_id 
      WHERE episodes.order_num = ${req.params.episodeNum} AND ch.tv_series_id = ${req.params.id} 
       AND ch.appeared_at <= episodes.order_num;
    `,
      (err, result) => {
        if (err) {
          console.log(err);
        } else {
          return res.json(result);
        }
      }
    )
  );
});

//************************************************************* ALL POSTS *******************************************************************
//tvseries post
router.post("/addtvseries", (req, res) => {
  if (
    req.body.title &&
    req.body.creator &&
    req.body.premiere &&
    req.body.poster &&
    req.body.wallpaper &&
    req.body.description &&
    req.body.network
  ) {
    database((db) =>
      db.query(
        `INSERT INTO tv_series (title, creator, premiere, poster, wallpaper, description, network) VALUES (
        ${mysql.escape(req.body.title)},
        ${mysql.escape(req.body.creator)},
        ${mysql.escape(req.body.premiere)},
        ${mysql.escape(req.body.poster)},
        ${mysql.escape(req.body.wallpaper)},
        ${mysql.escape(req.body.description)},
        ${mysql.escape(req.body.network)}
      )`,
        (err, result) => {
          if (err) {
            console.log(err);
            return res
              .status(400)
              .json({ msg: "Server error adding new TV Show" });
          } else {
            console.log(result);
            return res
              .status(201)
              .json({ msg: `TV Show ${req.body.title} succesfully added!` });
          }
        }
      )
    );
  } else {
    return res.status(400).json({ msg: "Passed values are incorrect" });
  }
});

//SEASONS POSTS
router.post("/addseasons", (req, res) => {
  if (req.body.season && req.body.seriesId) {
    database((db) =>
      db.query(
        `INSERT INTO seasons (season_name, tv_series_id) VALUES (
        ${mysql.escape(req.body.season)},
        ${mysql.escape(req.body.seriesId)}    
      )`,
        (err, result) => {
          if (err) {
            console.log(err);
            return res
              .status(400)
              .json({ msg: "Server error adding new Season to the Show" });
          } else {
            console.log(result);
            return res
              .status(201)
              .json({ msg: `New Season succesfully added!` });
          }
        }
      )
    );
  } else {
    return res.status(400).json({ msg: "Passed values are incorrect" });
  }
});

//EPISODES POSTS
router.post("/addEpisodes", (req, res) => {
  if (
    req.body.seasonId &&
    req.body.orderNum &&
    req.body.episodeTitle &&
    req.body.seriesId
  ) {
    database((db) =>
      db.query(
        `INSERT INTO episodes (season_id, order_num, episode_title, tv_series_id) VALUES (
        ${mysql.escape(req.body.seasonId)},
        ${mysql.escape(req.body.orderNum)},    
        ${mysql.escape(req.body.episodeTitle)},   
        ${mysql.escape(req.body.seriesId)}   
      )`,
        (err, result) => {
          if (err) {
            console.log(err);
            return res
              .status(400)
              .json({ msg: "Server error adding new Episode to the Season" });
          } else {
            console.log(result);
            return res
              .status(201)
              .json({ msg: `New Episode succesfully added!` });
          }
        }
      )
    );
  } else {
    return res.status(400).json({ msg: "Passed values are incorrect" });
  }
});

//POST to add new users to db (register)
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
              db.query(
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

//POST for login (jwt token expires in 7 days)
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

//POST CHARACTERS
router.post("/addCharacters", (req, res) => {
  if (
    req.body.fullname &&
    req.body.seriesId &&
    req.body.appearedAt &&
    req.body.vanishedAt &&
    req.body.causeOf &&
    req.body.photoURL
  ) {
    database((db) =>
      db.query(
        `INSERT INTO characters (fullname, tv_series_id, appeared_at, vanished_at, cause_of, photo) VALUES (
        ${mysql.escape(req.body.fullname)},
        ${mysql.escape(req.body.seriesId)},    
        ${mysql.escape(req.body.appearedAt)},    
        ${mysql.escape(req.body.vanishedAt)},  
        ${mysql.escape(req.body.causeOf)},  
        ${mysql.escape(req.body.photoURL)} 
      )`,
        (err, result) => {
          if (err) {
            console.log(err);
            return res
              .status(400)
              .json({ msg: "Server error adding new character to the Show" });
          } else {
            console.log(result);
            return res
              .status(201)
              .json({ msg: `New Character succesfully added!` });
          }
        }
      )
    );
  } else {
    return res.status(400).json({ msg: "Passed values are incorrect" });
  }
});

// ************************** ALL SIMPLE GETS ***************************************************************************************
//BOILERPLATE GET
router.get("/", (req, res) => {
  res.send("The API service works!");
});
//ALL USERS GET
router.get("/users", (req, res) => {
  database((db) =>
    db.query(`SELECT * FROM users`, (err, result) => {
      if (err) console.log(err);
      res.json(result);
    })
  );
});
//ALL SERIES GET
router.get("/shows", (req, res) => {
  database((db) =>
    db.query(`SELECT * FROM tv_series`, (err, result) => {
      if (err) console.log(err);
      res.json(result);
    })
  );
});
//ALL SEASONS GET
router.get("/seasons", (req, res) => {
  database((db) =>
    db.query(`SELECT * FROM seasons`, (err, result) => {
      if (err) console.log(err);
      res.json(result);
    })
  );
});
//ALL EPISODES GET
router.get("/episodes", (req, res) => {
  database((db) =>
    db.query(`SELECT * FROM episodes`, (err, result) => {
      if (err) console.log(err);
      res.json(result);
    })
  );
});
//ALL CHARACTERS GET
router.get("/characters", (req, res) => {
  database((db) =>
    db.query(`SELECT * FROM characters`, (err, result) => {
      if (err) console.log(err);
      res.json(result);
    })
  );
});
module.exports = router;
