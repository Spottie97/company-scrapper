const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const industriesPath = path.join(__dirname, '../data/industries.json');
    const data = await fs.readFile(industriesPath, 'utf8');
    res.json(JSON.parse(data));
  } catch (err) {
    console.error('Error reading industries file:', err);
    res.status(500).json({ error: 'Error fetching industries' });
  }
});

module.exports = router;