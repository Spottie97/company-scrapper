const express = require('express');
const fs = require('fs');
const path = require('path');
const serverless = require('serverless-http');

const app = express();
const router = express.Router();

router.get('/industries', (req, res) => {
  const industriesPath = path.join(__dirname, 'industries.json');
  fs.readFile(industriesPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading industries file:', err);
      res.status(500).json({ error: 'Error fetching industries' });
      return;
    }
    res.json(JSON.parse(data));
  });
});

app.use('/.netlify/functions', router);

module.exports.handler = serverless(app);