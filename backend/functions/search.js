require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { MongoClient, ServerApiVersion } = require("mongodb");
const serverless = require("serverless-http");

const app = express();
const router = express.Router();
const port = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, {
  useUnifiedTopology: true,
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
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    collection = client.db("companyData").collection("companies");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
}

connectToMongoDB();

router.get("/", (req, res) => {
  res.send("Hello World!");
});

router.get("/api/industries", (req, res) => {
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

const fetchFromGooglePlaces = async (location, industry, radius) => {
  try {
    const geocodeResponse = await axios.get("https://maps.googleapis.com/maps/api/geocode/json", {
      params: {
        address: location,
        key: process.env.GOOGLE_PLACES_API_KEY,
      },
    });

    if (!geocodeResponse.data.results.length) {
      console.error("Geocoding API response:", geocodeResponse.data);
      throw new Error("No geocoding results found");
    }

    const { lat, lng } = geocodeResponse.data.results[0].geometry.location;

    let places = [];
    let nextPageToken;
    do {
      const response = await axios.get("https://maps.googleapis.com/maps/api/place/nearbysearch/json", {
        params: {
          location: `${lat},${lng}`,
          radius: radius * 1000,
          keyword: industry,
          key: process.env.GOOGLE_PLACES_API_KEY,
          pagetoken: nextPageToken,
        },
      });
      places = places.concat(response.data.results);
      nextPageToken = response.data.next_page_token;
      if (nextPageToken) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } while (nextPageToken);

    const detailedPlaces = await Promise.all(
      places.map(async (place) => {
        const placeDetailsResponse = await axios.get("https://maps.googleapis.com/maps/api/place/details/json", {
          params: {
            place_id: place.place_id,
            fields: "name,formatted_phone_number,website,formatted_address,place_id",
            key: process.env.GOOGLE_PLACES_API_KEY,
          },
        });
        const details = placeDetailsResponse.data.result;
        return {
          id: details.place_id,
          name: details.name,
          contact: details.formatted_phone_number || "N/A",
          location: details.formatted_address,
          website: details.website || "N/A",
          industry,
        };
      })
    );

    return detailedPlaces;
  } catch (error) {
    console.error("Error fetching data from Google Places:", error.message);
    return [];
  }
};

router.get("/api/search", async (req, res) => {
  const { location, industry, radius } = req.query;
  const radiusLimit = parseInt(radius, 10) || 10;

  try {
    const cachedCompanies = await collection.find({ location, industry, radius: { $lte: radiusLimit } }).toArray();
    if (cachedCompanies.length > 0) {
      res.json(cachedCompanies);
    } else {
      const companies = await fetchFromGooglePlaces(location, industry, radiusLimit);

      if (companies.length > 0 && collection) {
        await collection.insertMany(companies, { ordered: false });
        console.log("Data inserted into MongoDB");

        const count = await collection.countDocuments();
        if (count > 1000) {
          await collection.deleteMany({});
          console.log("Database cleared after reaching 1000 entries");
        }
      } else {
        console.log("No data to insert into MongoDB");
      }

      res.json(companies);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching companies" });
  }
});

router.delete("/api/delete", async (req, res) => {
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

app.use("/.netlify/functions/search", router);

module.exports.handler = serverless(app);