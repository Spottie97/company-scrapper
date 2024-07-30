import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [location, setLocation] = useState('');
  const [industry, setIndustry] = useState('');
  const [radius, setRadius] = useState(10);
  const [companies, setCompanies] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState([]);

  useEffect(() => {
    const fetchIndustries = async () => {
      try {
        const response = await axios.get('/industries.json');
        setIndustries(response.data);
      } catch (err) {
        console.error('Error fetching industries:', err);
      }
    };
    fetchIndustries();
  }, []);

  const fetchFromGooglePlaces = async (location, industry, radius) => {
    try {
      const response = await axios.get('/api/places', {
        params: {
          location,
          radius,
          keyword: industry,
        },
      });
  
      if (!response.data.results.length) {
        console.error("No results found");
        return [];
      }
  
      const detailedPlaces = response.data.results.map(place => ({
        id: place.place_id,
        name: place.name,
        contact: place.formatted_phone_number || "N/A",
        location: place.formatted_address,
        website: place.website || "N/A",
        industry,
      }));
  
      return detailedPlaces;
    } catch (error) {
      console.error("Error fetching from Google Places:", error);
      return [];
    }
  };    
  
  const handleSearch = async () => {
    const cacheKey = `${location}-${industry}-${radius}`;
    const cachedCompanies = JSON.parse(localStorage.getItem(cacheKey)) || [];
    if (cachedCompanies.length > 0) {
      setCompanies(cachedCompanies);
    } else {
      const companies = await fetchFromGooglePlaces(location, industry, radius);
      setCompanies(companies);
      localStorage.setItem(cacheKey, JSON.stringify(companies));
    }
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
    const remainingCompanies = companies.filter(company => !selectedCompanies.includes(company.id));
    setCompanies(remainingCompanies);
    setSelectedCompanies([]);
    const cacheKey = `${location}-${industry}-${radius}`;
    localStorage.setItem(cacheKey, JSON.stringify(remainingCompanies));
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Company Finder</h1>
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
                      checked={selectedCompanies.length === companies.length}
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
