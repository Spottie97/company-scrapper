require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { MongoClient, ServerApiVersion } = require("mongodb");

const app = express();
const port = 5001;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let collection;

async function connectToMongoDB() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    collection = client.db("companyData").collection("companies");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
}

connectToMongoDB();

// Basic Route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Serve industries JSON file
app.get("/api/industries", (req, res) => {
  const industriesPath = path.join(__dirname, "industries.json");
  fs.readFile(industriesPath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading industries file:", err);
      res.status(500).json({ error: "Error fetching industries" });
      return;
    }
    res.json(JSON.parse(data));
  });
});

// Helper function to fetch data from Google Places API
const fetchFromGooglePlaces = async (location, industry, radius) => {
  try {
    const geocodeResponse = await axios.get(
      "https://maps.googleapis.com/maps/api/geocode/json",
      {
        params: {
          address: location,
          key: process.env.GOOGLE_PLACES_API_KEY,
        },
      }
    );

    if (!geocodeResponse.data.results.length) {
      console.error("Geocoding API response:", geocodeResponse.data);
      throw new Error("No geocoding results found");
    }

    const { lat, lng } = geocodeResponse.data.results[0].geometry.location;

    const response = await axios.get(
      "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
      {
        params: {
          location: `${lat},${lng}`,
          radius: radius * 1000, // Convert km to meters
          keyword: industry,
          key: process.env.GOOGLE_PLACES_API_KEY,
        },
      }
    );

    const places = response.data.results;
    return places.map((place) => ({
      id: place.place_id,
      name: place.name,
      contact: place.formatted_phone_number || "N/A",
      location: place.vicinity,
      industry,
      size: "N/A",
    }));
  } catch (error) {
    console.error("Error fetching data from Google Places:", error.message);
    return [];
  }
};

// Search Route
app.get("/api/search", async (req, res) => {
  const { location, industry, radius } = req.query;
  const radiusLimit = parseInt(radius, 10) || 10;

  try {
    const companies = await fetchFromGooglePlaces(
      location,
      industry,
      radiusLimit
    );

    if (companies.length > 0 && collection) {
      await collection.insertMany(companies);
      console.log("Data inserted into MongoDB");
    } else {
      console.log("No data to insert into MongoDB");
    }

    res.json(companies);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching companies" });
  }
});

// Delete Route
app.delete("/api/delete", async (req, res) => {
  const { ids } = req.body;

  try {
    if (collection) {
      await collection.deleteMany({ id: { $in: ids } });
      console.log("Data deleted from MongoDB");
    }
    res.status(200).send("Deleted successfully");
  } catch (error) {
    console.error("Error deleting data:", error);
    res.status(500).json({ error: "Error deleting data" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
