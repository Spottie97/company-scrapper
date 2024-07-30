const axios = require('axios');

module.exports = async (req, res) => {
  const { location, radius, keyword } = req.query;
  const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
      params: {
        location,
        radius,
        keyword,
        key: GOOGLE_PLACES_API_KEY,
      },
    });
    res.status(200).json(response.data);
  } catch (error) {
    console.error("Error fetching data from Google Places:", error);
    res.status(500).json({ error: error.message });
  }
};
