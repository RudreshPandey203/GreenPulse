'use client';

import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import styles from './EmissionForm.module.css';
import { EMISSION_FACTORS } from '../lib/emissionFactors';
import { format } from 'date-fns'; // Import date-fns for formatting

const EmissionForm = ({ userId }) => {
  const [category, setCategory] = useState('travel');
  const [activity, setActivity] = useState('car_gasoline');
  const [amount, setAmount] = useState('');
  // Add state for the date, default to today
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd')); // Format as YYYY-MM-DD for input

  const handleCategoryChange = (e) => {
    const newCategory = e.target.value;
    setCategory(newCategory);
    // Reset activity when category changes, ensure it exists
    const categoryFactors = EMISSION_FACTORS[newCategory];
     if (categoryFactors) {
        setActivity(Object.keys(categoryFactors)[0]);
     } else {
         console.warn(`No emission factors found for category: ${newCategory}`);
         setActivity(''); // Or handle appropriately
     }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) {
      alert('You must be logged in to add an emission.');
      return;
    }
    if (!amount || amount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }
    if (!selectedDate) {
        alert('Please select a date.');
        return;
    }

    // Ensure factor exists before calculation
    const factor = EMISSION_FACTORS[category]?.[activity];
     if (factor === undefined) {
         alert(`Emission factor not found for ${category} - ${activity}. Cannot calculate.`);
         console.error(`Missing factor for: ${category}.${activity}`);
         return;
     }

    const co2 = (amount * factor).toFixed(2);

    const newEmission = {
      category,
      activity: activity.replace(/_/g, ' '),
      amount: parseFloat(amount),
      co2: parseFloat(co2),
      // Store the selected date as an ISO string or Firestore Timestamp
      // Using ISO string here for consistency with previous setup.
      // Use new Date(selectedDate).toISOString() if you want UTC time.
      // Using just selectedDate stores YYYY-MM-DD. For accurate time-series, use a full timestamp.
      date: selectedDate, // Store as YYYY-MM-DD string
      // Consider adding a serverTimestamp as well for creation order if needed
      // createdAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, 'users', userId, 'emissions'), newEmission);
      setAmount('');
      // Optionally reset date, or keep it for next entry
      // setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("Failed to save activity. Please try again.");
    }
  };

  const activityOptions = Object.keys(EMISSION_FACTORS[category] || {}).map((key) => (
    <option key={key} value={key}>
      {key.replace(/_/g, ' ')}
    </option>
  ));

  const getUnit = () => {
    if (category === 'travel') return 'km';
    if (category === 'home') return 'kWh';
    if (category === 'food') return 'servings';
    return ''; // Default unit or handle other categories
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2>Log a New Activity</h2>
      {/* Category Select */}
      <div className={styles.formGroup}>
        <label htmlFor="category">Category</label>
        <select id="category" value={category} onChange={handleCategoryChange}>
          <option value="travel">Travel</option>
          <option value="home">Home Energy</option>
          <option value="food">Food</option>
        </select>
      </div>
      {/* Activity Select */}
      {EMISSION_FACTORS[category] && ( // Only show if factors exist for category
        <div className={styles.formGroup}>
            <label htmlFor="activity">Activity</label>
            <select id="activity" value={activity} onChange={(e) => setActivity(e.target.value)}>
            {activityOptions}
            </select>
        </div>
      )}
       {/* Amount Input */}
      <div className={styles.formGroup}>
        <label htmlFor="amount">Amount {getUnit() ? `(${getUnit()})` : ''}</label>
        <input
          id="amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={`Enter amount ${getUnit() ? `in ${getUnit()}` : ''}`}
          min="0"
          step="any" // Allow decimals
        />
      </div>
       {/* Date Picker */}
       <div className={styles.formGroup}>
           <label htmlFor="date">Date</label>
           <input
               id="date"
               type="date"
               value={selectedDate}
               onChange={(e) => setSelectedDate(e.target.value)}
               required
            />
       </div>

      <button type="submit" className={styles.submitButton}>
        Add to Tracker
      </button>
    </form>
  );
};

export default EmissionForm;
