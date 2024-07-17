require('dotenv').config();

const express = require('express');
const cors = require('cors');
const serverless = require('serverless-http');

const app = express();
app.use(cors());
app.use(express.json());

const routes = [
  require('./routes/industries'),
  require('./routes/search'),
  require('./routes/delete'),
];

routes.forEach((route) => app.use('/.netlify/functions', route));

module.exports.handler = serverless(app);