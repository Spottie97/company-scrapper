import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [location, setLocation] = useState('');
  const [industry, setIndustry] = useState('');
  const [radius, setRadius] = useState(10);
  const [companies, setCompanies] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [industries, setIndustries] = useState([]);

  useEffect(() => {
    // Fetch industry data from backend
    const fetchIndustries = async () => {
      try {
        const response = await fetch('/.netlify/functions/api/industries');
        const data = await response.json();
        
        // Check if the data is an array
        if (Array.isArray(data)) {
          setIndustries(data);
        } else {
          console.error('Unexpected industry data format:', data);
        }
      } catch (error) {
        console.error('Error fetching industries:', error);
      }
    };

    fetchIndustries();
  }, []);

  const handleSearch = async () => {
    try {
      const response = await fetch(`/.netlify/functions/api/search?location=${location}&industry=${industry}&radius=${radius}`);
      const data = await response.json();

      if (Array.isArray(data)) {
        setCompanies(data);
        setSelectedCompanies([]); // Clear selections on new search
      } else {
        setCompanies([]);
        console.error('Unexpected response format:', data);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      setCompanies([]);
    }
  };

  const handleSelectCompany = (id) => {
    setSelectedCompanies(prevSelected =>
      prevSelected.includes(id) ? prevSelected.filter(companyId => companyId !== id) : [...prevSelected, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedCompanies.length === companies.length) {
      setSelectedCompanies([]);
    } else {
      setSelectedCompanies(companies.map(company => company.id));
    }
  };

  const handleDeleteSelected = async () => {
    try {
      const response = await fetch(`/.netlify/functions/api/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids: selectedCompanies })
      });

      if (response.ok) {
        setCompanies(prevCompanies => prevCompanies.filter(company => !selectedCompanies.includes(company.id)));
        setSelectedCompanies([]);
      } else {
        console.error('Failed to delete selected companies');
      }
    } catch (error) {
      console.error('Error deleting selected companies:', error);
    }
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
                  <th><input type="checkbox" checked={selectedCompanies.length === companies.length && companies.length > 0} onChange={handleSelectAll} /></th>
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
                    <td><input type="checkbox" checked={selectedCompanies.includes(company.id)} onChange={() => handleSelectCompany(company.id)} /></td>
                    <td>{company.name}</td>
                    <td>{company.contact}</td>
                    <td>{company.location}</td>
                    <td>{company.industry}</td>
                    <td><a href={company.website} target="_blank" rel="noopener noreferrer">{company.website}</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No companies found for the specified criteria.</p>
          )}
        </div>
        {selectedCompanies.length > 0 && <button onClick={handleDeleteSelected}>Delete Selected</button>}
      </header>
    </div>
  );
}

export default App;