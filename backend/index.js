const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = 5001; // Use the port you've set

// Middleware
app.use(cors());
app.use(express.json());

// Basic Route
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Search Route
app.get('/api/search', async (req, res) => {
    const { location, industry } = req.query;
  
    try {
      const response = await axios.get('https://company.clearbit.com/v2/companies/find', {
        headers: {
          'Authorization': `Bearer ${process.env.CLEARBIT_API_KEY}`
        },
        params: {
          location,
          industry
        }
      });
  
      console.log(response.data); // Log the response data
      const companies = response.data;
  
      // Filter companies based on size
      // Ensure the data is in array format before filtering
      const filteredCompanies = Array.isArray(companies) ? companies.filter(company => company.metrics.employees < 100) : [];
  
      res.json(filteredCompanies);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error fetching companies' });
    }
  });

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});