import React, { useState } from 'react';
import './App.css';

function App() {
  const [location, setLocation] = useState('');
  const [industry, setIndustry] = useState('');
  const [api, setApi] = useState('Clearbit');
  const [companies, setCompanies] = useState([]);

  const handleSearch = async () => {
    try {
      const response = await fetch(`http://localhost:5001/api/search?location=${location}&industry=${industry}&api=${api}`);
      const data = await response.json();

      if (Array.isArray(data)) {
        setCompanies(data);
      } else {
        setCompanies([]);
        console.error('Unexpected response format:', data);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      setCompanies([]);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Find Small Companies</h1>
        <div className="search-form">
          <input
            type="text"
            placeholder="Location"
            value={location}
            onChange={e => setLocation(e.target.value)}
          />
          <input
            type="text"
            placeholder="Industry"
            value={industry}
            onChange={e => setIndustry(e.target.value)}
          />
          <select value={api} onChange={e => setApi(e.target.value)}>
            <option value="Clearbit">Clearbit API</option>
            <option value="LinkedIn">LinkedIn API</option>
            <option value="Crunchbase">Crunchbase API</option>
            <option value="GooglePlaces">Google Places API</option>
          </select>
          <button onClick={handleSearch}>Search</button>
        </div>
        <ul className="company-list">
          {companies.map(company => (
            <li key={company.id}>
              {company.name} - {company.contact}
            </li>
          ))}
        </ul>
      </header>
    </div>
  );
}

export default App;