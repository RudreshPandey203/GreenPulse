'use client';
import { useState, useMemo } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import styles from './Dashboard.module.css';

ChartJS.register(ArcElement, Tooltip, Legend);

const Dashboard = ({ emissions }) => {
  const data = useMemo(() => {
    const categoryTotals = {
      travel: 0,
      home: 0,
      food: 0,
    };

    emissions.forEach((emission) => {
      if (categoryTotals[emission.category] !== undefined) {
        categoryTotals[emission.category] += emission.co2;
      }
    });

    const totalEmissions = Object.values(categoryTotals).reduce(
      (sum, val) => sum + val,
      0
    );

    return {
      labels: ['Travel', 'Home Energy', 'Food'],
      datasets: [
        {
          data: [
            categoryTotals.travel.toFixed(2),
            categoryTotals.home.toFixed(2),
            categoryTotals.food.toFixed(2),
          ],
          backgroundColor: ['#2a9d8f', '#e9c46a', '#e76f51'],
          borderColor: ['#ffffff', '#ffffff', '#ffffff'],
          borderWidth: 2,
        },
      ],
      totalEmissions: totalEmissions.toFixed(2),
    };
  }, [emissions]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
            color: '#264653',
            font: {
                size: 14,
            }
        }
      },
    },
  };

  return (
    <div className={styles.dashboard}>
      <h2>Your CO₂ Footprint</h2>
      <div className={styles.chartContainer}>
        {data.totalEmissions > 0 ? (
          <Doughnut data={data} options={options} />
        ) : (
          <p className={styles.noDataText}>Log an activity to see your footprint!</p>
        )}
      </div>
      <div className={styles.total}>
        Total Emissions: <span>{data.totalEmissions} kg CO₂</span>
      </div>
      <div className={styles.emissionList}>
        <h3>Recent Activities</h3>
        {emissions.length > 0 ? (
          <ul>
            {emissions.slice(0, 5).map((e) => (
              <li key={e.id}>
                <span>{e.activity}</span> <strong>{e.co2} kg CO₂</strong>
              </li>
            ))}
          </ul>
        ) : (
          <p>No activities logged yet.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;