const axios = require('axios');

module.exports = async (req, res) => {
  const { location, radius, keyword } = req.query;
  const GOOGLE_PLACES_API_KEY = process.env.REACT_APP_GOOGLE_PLACES_API_KEY;

  try {
    // Step 1: Use the Geocoding API to get the coordinates for the location
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json`;
    const geocodeResponse = await axios.get(geocodeUrl, {
      params: {
        address: location,
        key: GOOGLE_PLACES_API_KEY,
      },
    });

    if (!geocodeResponse.data.results.length) {
      return res.status(400).json({ error: "Location not found." });
    }

    const { lat, lng } = geocodeResponse.data.results[0].geometry.location;

    // Step 2: Use the Places API to find businesses around the coordinates
    const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json`;
    const placesResponse = await axios.get(placesUrl, {
      params: {
        location: `${lat},${lng}`,
        radius: radius * 1000, // Convert to meters
        keyword,
        key: GOOGLE_PLACES_API_KEY,
      },
    });

    const placeDetails = await Promise.all(
      placesResponse.data.results.map(async place => {
        // Step 3: Get detailed info for each place
        const placeDetailsUrl = `https://maps.googleapis.com/maps/api/place/details/json`;
        const detailsResponse = await axios.get(placeDetailsUrl, {
          params: {
            place_id: place.place_id,
            fields: 'name,formatted_phone_number,website,formatted_address',
            key: GOOGLE_PLACES_API_KEY,
          },
        });

        const details = detailsResponse.data.result;

        return {
          id: details.place_id,
          name: details.name,
          contact: details.formatted_phone_number || "N/A",
          location: details.formatted_address,
          website: details.website || "N/A",
        };
      })
    );

    res.status(200).json(placeDetails);
  } catch (error) {
    console.error("Error fetching data from Google Places:", error);
    res.status(500).json({ error: error.message });
  }
};
