import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [location, setLocation] = useState('');
  const [industry, setIndustry] = useState('');
  const [radius, setRadius] = useState(10);
  const [companies, setCompanies] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [industries, setIndustries] = useState([]);
  const GOOGLE_PLACES_API_KEY = process.env.REACT_APP_GOOGLE_PLACES_API_KEY;

  const fetchIndustries = async () => {
    try {
      const response = await axios.get('/frontend/src/industries.json');
      setIndustries(response.data);
    } catch (error) {
      console.error('Error fetching industries:', error);
    }
  };

  useEffect(() => {
    fetchIndustries();
  }, []);

  const fetchFromGooglePlaces = async () => {
    try {
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json`;
      const geocodeParams = { address: location, key: GOOGLE_PLACES_API_KEY };
      const geocodeResponse = await axios.get(geocodeUrl, { params: geocodeParams });

      if (!geocodeResponse.data.results.length) {
        console.error("No geocoding results found");
        return;
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

      setCompanies(detailedPlaces);
    } catch (error) {
      console.error("Error fetching from Google Places:", error);
    }
  };

  const handleSearch = () => {
    fetchFromGooglePlaces();
  };

  const handleSelectCompany = (id) => {
    setSelectedCompanies(prevSelected =>
      prevSelected.includes(id) ? prevSelected.filter(companyId => companyId !== id) : [...prevSelected, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedCompanies(selectedCompanies.length === companies.length ? [] : companies.map(company => company.id));
  };

  const handleDeleteSelected = () => {
    setCompanies(prevCompanies => prevCompanies.filter(company => !selectedCompanies.includes(company.id)));
    setSelectedCompanies([]);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Scrap my location</h1>
        <div className="search-form">
          <input
            type="text"
            placeholder="Location"
            value={location}
            onChange={e => setLocation(e.target.value)}
          />
          <select value={industry} onChange={e => setIndustry(e.target.value)}>
            <option value="">Select Industry</option>
            {industries.map(ind => (
              <option key={ind.code} value={ind.description}>{ind.description}</option>
            ))}
          </select>
          <label>
            Radius: {radius} km
            <input
              type="range"
              min="1"
              max="50"
              value={radius}
              onChange={e => setRadius(e.target.value)}
            />
          </label>
          <button onClick={handleSearch}>Search</button>
        </div>
        <div className="table-container">
          {companies.length > 0 ? (
            <table className="company-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={selectedCompanies.length === companies.length && companies.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Location</th>
                  <th>Industry</th>
                  <th>Website</th>
                </tr>
              </thead>
              <tbody>
                {companies.map(company => (
                  <tr key={company.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedCompanies.includes(company.id)}
                        onChange={() => handleSelectCompany(company.id)}
                      />
                    </td>
                    <td>{company.name}</td>
                    <td>{company.contact}</td>
                    <td>{company.location}</td>
                    <td>{company.industry}</td>
                    <td>
                      <a href={company.website} target="_blank" rel="noopener noreferrer">
                        {company.website}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No companies found for the specified criteria.</p>
          )}
        </div>
        {selectedCompanies.length > 0 && (
          <button onClick={handleDeleteSelected}>Delete Selected</button>
        )}
      </header>
    </div>
  );
}

export default App;
