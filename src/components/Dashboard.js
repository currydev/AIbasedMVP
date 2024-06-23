import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Dashboard() {
  const [purchases, setPurchases] = useState([]);

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/network-purchases', {
          headers: { Authorization: localStorage.getItem('token') }
        });
        setPurchases(response.data);
      } catch (error) {
        console.error('Error fetching purchases:', error);
      }
    };

    fetchPurchases();
  }, []);

  const toggleVisibility = async (id) => {
    try {
      await axios.patch(`http://localhost:5000/api/purchases/${id}/visibility`, {}, {
        headers: { Authorization: localStorage.getItem('token') }
      });
      // Refresh purchases after toggling visibility
      const response = await axios.get('http://localhost:5000/api/network-purchases', {
        headers: { Authorization: localStorage.getItem('token') }
      });
      setPurchases(response.data);
    } catch (error) {
      console.error('Error toggling visibility:', error);
    }
  };

  return (
    <div>
      <h1>Friend Network Purchases</h1>
      {purchases.map(purchase => (
        <div key={purchase._id}>
          <p>{purchase.item}</p>
          <button onClick={() => toggleVisibility(purchase._id)}>
            {purchase.visible ? 'Hide' : 'Show'}
          </button>
        </div>
      ))}
    </div>
  );
}

export default Dashboard;