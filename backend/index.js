require("dotenv").config();
const express = require("express");
const cors = require("cors");
const serverless = require("serverless-http");
const industriesRoute = require("./routes/industries");
const searchRoute = require("./routes/search");
const deleteRoute = require("./routes/delete");

const app = express();
app.use(cors());
app.use(express.json());

app.use('/.netlify/functions', industriesRoute);
app.use('/.netlify/functions', searchRoute);
app.use('/.netlify/functions', deleteRoute);

module.exports.handler = serverless(app);