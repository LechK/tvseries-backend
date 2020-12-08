const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const router = require("./routes");
require("dotenv").config();

const port = process.env.SERVER_PORT || 3000;

const app = express();

app.use(bodyParser.json());
app.use(cors());
app.use(router);

app.listen(port, () => console.log(`Server is rolling on port ${port}`));
