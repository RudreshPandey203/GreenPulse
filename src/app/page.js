'use client';

import { useState } from 'react';
import Header from '../components/Header';
import EmissionForm from '../components/EmissionForm';
import Dashboard from '../components/Dashboard';

export default function Home() {
  // We manage the list of emissions here, in the parent component.
  const [emissions, setEmissions] = useState([]);

  const addEmission = (newEmission) => {
    // Add the new emission to the top of the list
    setEmissions((prevEmissions) => [newEmission, ...prevEmissions]);
  };

  return (
    <>
      <Header />
      <main className="main-content">
        <div className="container">
          <div className="form-section">
            <EmissionForm addEmission={addEmission} />
          </div>
          <div className="dashboard-section">
            <Dashboard emissions={emissions} />
          </div>
        </div>
      </main>
    </>
  );
}