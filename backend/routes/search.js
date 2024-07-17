const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const axios = require('axios');
const router = express.Router();

const MONGO_URI = process.env.MONGO_URI;
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

const client = new MongoClient(MONGO_URI, {
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
    collection = client.db("companyData").collection("companies");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

connectToMongoDB();

const fetchFromGooglePlaces = async (location, industry, radius) => {
  try {
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json`;
    const geocodeParams = { address: location, key: GOOGLE_PLACES_API_KEY };
    const geocodeResponse = await axios.get(geocodeUrl, { params: geocodeParams });

    if (!geocodeResponse.data.results.length) {
      throw new Error("No geocoding results found");
    }

    const { lat, lng } = geocodeResponse.data.results[0].geometry.location;
    let places = [];
    let nextPageToken;

    do {
      const placesResponse = await axios.get("https://maps.googleapis.com/maps/api/place/nearbysearch/json", {
        params: {
          location: `${lat},${lng}`,
          radius: radius * 1000,
          keyword: industry,
          key: GOOGLE_PLACES_API_KEY,
          pagetoken: nextPageToken,
        },
      });
      places = places.concat(placesResponse.data.results);
      nextPageToken = placesResponse.data.next_page_token;
      if (nextPageToken) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } while (nextPageToken);

    const detailedPlaces = await Promise.all(places.map(async (place) => {
      const placeDetailsResponse = await axios.get("https://maps.googleapis.com/maps/api/place/details/json", {
        params: {
          place_id: place.place_id,
          fields: "name,formatted_phone_number,website,formatted_address,place_id",
          key: GOOGLE_PLACES_API_KEY,
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
    }));

    return detailedPlaces;
  } catch (error) {
    console.error("Error fetching from Google Places:", error);
    return [];
  }
};

router.get('/', async (req, res) => {
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
        const count = await collection.countDocuments();
        if (count > 1000) {
          await collection.deleteMany({});
        }
      }

      res.json(companies);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching companies" });
  }
});

module.exports = router;