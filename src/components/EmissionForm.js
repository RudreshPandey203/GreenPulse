'use client';

import { useState } from 'react';
import styles from './EmissionForm.module.css';
import { EMISSION_FACTORS } from '../lib/emissionFactors';

const EmissionForm = ({ addEmission }) => {
  const [category, setCategory] = useState('travel');
  const [activity, setActivity] = useState('car_gasoline');
  const [amount, setAmount] = useState('');

  const handleCategoryChange = (e) => {
    const newCategory = e.target.value;
    setCategory(newCategory);
    // Reset activity when category changes
    setActivity(Object.keys(EMISSION_FACTORS[newCategory])[0]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    const factor = EMISSION_FACTORS[category][activity];
    const co2 = (amount * factor).toFixed(2);

    const newEmission = {
      id: Date.now(),
      category,
      activity: activity.replace(/_/g, ' '),
      amount,
      co2: parseFloat(co2),
      date: new Date().toISOString(),
    };

    addEmission(newEmission);
    setAmount('');
  };

  const activityOptions = Object.keys(EMISSION_FACTORS[category]).map((key) => (
    <option key={key} value={key}>
      {key.replace(/_/g, ' ')}
    </option>
  ));

  const getUnit = () => {
    if (category === 'travel') return 'km';
    if (category === 'home') return 'kWh';
    return 'servings';
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2>Log a New Activity</h2>
      <div className={styles.formGroup}>
        <label>Category</label>
        <select value={category} onChange={handleCategoryChange}>
          <option value="travel">Travel</option>
          <option value="home">Home Energy</option>
          <option value="food">Food</option>
        </select>
      </div>
      <div className={styles.formGroup}>
        <label>Activity</label>
        <select value={activity} onChange={(e) => setActivity(e.target.value)}>
          {activityOptions}
        </select>
      </div>
      <div className={styles.formGroup}>
        <label>Amount ({getUnit()})</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={`Enter amount in ${getUnit()}`}
          min="0"
        />
      </div>
      <button type="submit" className={styles.submitButton}>
        Add to Tracker
      </button>
    </form>
  );
};

export default EmissionForm;