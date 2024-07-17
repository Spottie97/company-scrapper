require('dotenv').config();

const express = require('express');
const cors = require('cors');
const serverless = require('serverless-http');

const app = express();
app.use(cors());
app.use(express.json());

const industriesRouter = require('./routes/industries');
const searchRouter = require('./routes/search');
const deleteRouter = require('./routes/delete');

app.use('/.netlify/functions/industries', industriesRouter);
app.use('/.netlify/functions/search', searchRouter);
app.use('/.netlify/functions/delete', deleteRouter);

module.exports.handler = serverless(app);