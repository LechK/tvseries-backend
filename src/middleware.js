const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = {
  //user registration and login validation
  userValidation: (req, res, next) => {
    if (!req.body.email && req.body.email.includes("@")) {
      return res.status(400).json({ msg: "Email not follow the rules" });
    }

    if (
      !req.body.password ||
      req.body.password.length < 8 ||
      req.body.password.length > 64
    ) {
      return res.status(400).json({
        msg: "Error: Password is less than 8 or more than 64 characters",
      });
    }

    next();
  },
  isLoggedIn: (req, res, next) => {
    try {
      const token = req.headers.authorization.split(" ")[1];
      const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
      req.userData = decodedToken;
      next();
    } catch (err) {
      return res.status(401).send({ msg: "Your session is no longer valid" });
    }
  },
};
