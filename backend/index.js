require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
const port = 5001;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const uri = process.env.MONGO_URI;  // Ensure MONGO_URI is defined in .env
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let collection;

async function connectToMongoDB() {
  try {
    // Connect the client to the server
    await client.connect();
    // Verify connection with a ping command
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    // Set the collection to be used
    collection = client.db("companyData").collection("companies");
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

connectToMongoDB();

// Basic Route
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Helper function to fetch data from Google Places API
const fetchFromGooglePlaces = async (location, industry) => {
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
      params: {
        query: `${industry} in ${location}`,
        key: process.env.GOOGLE_PLACES_API_KEY
      }
    });

    const places = response.data.results;
    return places.map(place => ({
      id: place.place_id,
      name: place.name,
      contact: place.formatted_phone_number || 'N/A',
      location: place.formatted_address,
      industry,
      size: 'N/A' // Google Places API does not provide size, so this is a placeholder
    }));
  } catch (error) {
    console.error('Error fetching data from Google Places:', error);
    return [];
  }
};

// Search Route
app.get('/api/search', async (req, res) => {
  const { location, industry } = req.query;

  try {
    const companies = await fetchFromGooglePlaces(location, industry);

    // Insert fetched data into MongoDB
    if (collection) {
      await collection.insertMany(companies);
      console.log('Data inserted into MongoDB');
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