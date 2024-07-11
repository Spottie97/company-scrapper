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

const fetchFromClearbit = async (location, industry) => {
    const response = await axios.get('https://company.clearbit.com/v2/companies/find', {
      headers: {
        'Authorization': `Bearer ${process.env.CLEARBIT_API_KEY}`
      },
      params: { location, industry }
    });
    const companies = response.data;
    return Array.isArray(companies) ? companies.filter(company => company.metrics.employees < 100) : [];
  };
  
  const fetchFromLinkedIn = async (location, industry) => {
    // Implement LinkedIn API call here
    // Example placeholder
    return [
      {
        id: 2,
        name: 'LinkedIn Company',
        contact: 'linkedin@example.com',
        location,
        industry,
        size: 50
      }
    ];
  };
  
  const fetchFromCrunchbase = async (location, industry) => {
    // Implement Crunchbase API call here
    // Example placeholder
    return [
      {
        id: 3,
        name: 'Crunchbase Company',
        contact: 'crunchbase@example.com',
        location,
        industry,
        size: 30
      }
    ];
  };
  
  const fetchFromGooglePlaces = async (location, industry) => {
    // Implement Google Places API call here
    // Example placeholder
    return [
      {
        id: 4,
        name: 'Google Places Company',
        contact: 'googleplaces@example.com',
        location,
        industry,
        size: 20
      }
    ];
  };
  
  // Search Route
  app.get('/api/search', async (req, res) => {
    const { location, industry, api } = req.query;
  
    try {
      let companies;
      switch (api) {
        case 'LinkedIn':
          companies = await fetchFromLinkedIn(location, industry);
          break;
        case 'Crunchbase':
          companies = await fetchFromCrunchbase(location, industry);
          break;
        case 'GooglePlaces':
          companies = await fetchFromGooglePlaces(location, industry);
          break;
        case 'Clearbit':
        default:
          companies = await fetchFromClearbit(location, industry);
          break;
      }
  
      res.json(companies);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error fetching companies' });
    }
  });

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});