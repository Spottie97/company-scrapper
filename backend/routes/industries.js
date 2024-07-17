const express = require('express');
const fs = require('fs');
const path = require('path');
const serverless = require('serverless-http');

const app = express();
const router = express.Router();

router.get('/industries', async (req, res) => {
  try {
    const industriesPath = path.join(__dirname, 'industries.json');
    const data = await fs.promises.readFile(industriesPath, 'utf8');
    res.json(JSON.parse(data));
  } catch (err) {
    console.error('Error reading industries file:', err);
    res.status(500).json({ error: 'Error fetching industries' });
  }
});

app.use('/.netlify/functions', router);

module.exports.handler = serverless(app);