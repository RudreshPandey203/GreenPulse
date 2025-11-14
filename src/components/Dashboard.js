'use client';
import { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  TimeScale, // Import TimeScale
  TimeSeriesScale // Required for time series data
} from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns'; // Import the adapter
import { parseISO, format, startOfDay, addDays } from 'date-fns'; // Import date-fns functions
import styles from './Dashboard.module.css';

// Register necessary Chart.js components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  TimeScale, // Register TimeScale
  TimeSeriesScale // Register TimeSeriesScale
);

// Helper function to format date string consistently (YYYY-MM-DD)
const formatDateKey = (dateStringOrObject) => {
    try {
        if (!dateStringOrObject) return null;
        // Check if it's already a Date object or needs parsing
        const date = typeof dateStringOrObject === 'string' ? parseISO(dateStringOrObject) : dateStringOrObject;
        return format(startOfDay(date), 'yyyy-MM-dd'); // Group by day
    } catch (e) {
        console.error("Error formatting date:", dateStringOrObject, e);
        return null; // Handle invalid dates
    }
};

const Dashboard = ({ emissions }) => {
  const [showAnalytics, setShowAnalytics] = useState(false); // State to toggle views

  // Memoized data processing for Doughnut Chart
  const doughnutData = useMemo(() => {
    const categoryTotals = { travel: 0, home: 0, food: 0 };
    let totalEmissions = 0;

    emissions.forEach((emission) => {
      const category = emission.category?.toLowerCase(); // Handle potential casing issues
      if (categoryTotals[category] !== undefined && typeof emission.co2 === 'number') {
        categoryTotals[category] += emission.co2;
        totalEmissions += emission.co2;
      }
    });

    return {
      labels: ['Travel', 'Home Energy', 'Food'],
      datasets: [
        {
          data: [
            categoryTotals.travel,
            categoryTotals.home,
            categoryTotals.food,
          ].map(val => val.toFixed(2)), // Format after summing
          backgroundColor: ['#2a9d8f', '#e9c46a', '#e76f51'],
          borderColor: ['#ffffff', '#ffffff', '#ffffff'],
          borderWidth: 2,
        },
      ],
      totalEmissions: totalEmissions.toFixed(2),
    };
  }, [emissions]);

  // Memoized data processing for Line Chart
  const lineChartData = useMemo(() => {
    if (!emissions || emissions.length === 0) {
        return { labels: [], datasets: [] };
    }

    // Sort emissions by date - IMPORTANT for line chart
    const sortedEmissions = [...emissions]
        .filter(e => e.date) // Ensure date exists
        .sort((a, b) => parseISO(a.date) - parseISO(b.date));

    // Group emissions by date (YYYY-MM-DD) and sum CO2
    const dailyTotals = sortedEmissions.reduce((acc, emission) => {
      const dateKey = formatDateKey(emission.date);
      if (dateKey && typeof emission.co2 === 'number') {
          acc[dateKey] = (acc[dateKey] || 0) + emission.co2;
      }
      return acc;
    }, {});

     // Create data points for the chart {x: date, y: co2}
     const dataPoints = Object.entries(dailyTotals).map(([date, co2]) => ({
         // Ensure the date is correctly parsed for the time scale
         // Add time to avoid date shifting issues due to timezone, using midday
         x: parseISO(date + 'T12:00:00Z').getTime(), // Use epoch milliseconds
         y: parseFloat(co2.toFixed(2))
     }));


    return {
      datasets: [
        {
          label: 'Daily CO₂ Emissions (kg)',
          data: dataPoints,
          fill: false,
          borderColor: '#2a9d8f',
          tension: 0.1,
          pointBackgroundColor: '#e76f51',
          pointRadius: 4,
        },
      ],
    };
  }, [emissions]);

  // Doughnut Chart Options
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#264653', font: { size: 14 } }
      },
      title: { display: false } // No title for doughnut
    },
  };

   // Line Chart Options
   const lineChartOptions = {
       responsive: true,
       maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: { color: '#264653', font: { size: 14 } }
            },
            title: {
                display: true,
                text: 'CO₂ Emissions Over Time',
                color: '#264653',
                font: { size: 18 }
            },
            tooltip: {
                callbacks: {
                   title: function(context) {
                       // Format the date in the tooltip title
                       const date = new Date(context[0].parsed.x);
                       return format(date, 'MMM d, yyyy');
                   },
                   label: function(context) {
                       let label = context.dataset.label || '';
                       if (label) {
                           label += ': ';
                       }
                       if (context.parsed.y !== null) {
                           label += context.parsed.y + ' kg CO₂';
                       }
                       return label;
                   }
                }
            }
        },
        scales: {
            x: {
                type: 'time', // Use the time scale
                time: {
                    unit: 'day', // Display units in days
                    tooltipFormat: 'MMM d, yyyy', // Format for tooltips
                    displayFormats: {
                        day: 'MMM d' // Format for axis labels
                    }
                },
                title: {
                    display: true,
                    text: 'Date',
                    color: '#264653'
                },
                 ticks: {
                     color: '#555',
                      // Auto skip ticks to prevent overlap, adjust as needed
                     autoSkip: true,
                     maxTicksLimit: 10 // Limit the number of ticks displayed
                 }
            },
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'CO₂ Emissions (kg)',
                    color: '#264653'
                },
                ticks: {
                     color: '#555'
                 }
            }
        }
    };


  // Get the 5 most recent activities based on the date string
  const recentActivities = useMemo(() => {
    return [...emissions]
        .filter(e => e.date) // Ensure date exists
        .sort((a, b) => parseISO(b.date) - parseISO(a.date)) // Sort descending by date
        .slice(0, 5);
   }, [emissions]);


  return (
    <div className={styles.dashboard}>
      {/* Toggle Button */}
       <div className={styles.viewToggle}>
            <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                className={styles.toggleButton}
            >
                {showAnalytics ? 'View Summary' : 'View Analytics'}
            </button>
       </div>

      {showAnalytics ? (
        // Analytics View (Line Chart)
         <>
            <h2>Emissions Analytics</h2>
            <div className={styles.chartContainer}>
                 {lineChartData.datasets.length > 0 && lineChartData.datasets[0].data.length > 0 ? (
                    <Line data={lineChartData} options={lineChartOptions} />
                 ) : (
                    <p className={styles.noDataText}>Log some activities to see analytics.</p>
                 )}
            </div>
         </>

      ) : (
        // Summary View (Doughnut Chart + Recent List)
        <>
          <h2>Your CO₂ Footprint Summary</h2>
          <div className={styles.chartContainer}>
            {doughnutData.totalEmissions > 0 ? (
              <Doughnut data={doughnutData} options={doughnutOptions} />
            ) : (
              <p className={styles.noDataText}>Log an activity to see your footprint!</p>
            )}
          </div>
          <div className={styles.total}>
            Total Emissions: <span>{doughnutData.totalEmissions} kg CO₂</span>
          </div>
          <div className={styles.emissionList}>
            <h3>Recent Activities</h3>
            {recentActivities.length > 0 ? (
              <ul>
                {recentActivities.map((e) => (
                  <li key={e.id}>
                    <span>{formatDateKey(e.date)}: {e.activity} ({e.amount}{getUnit(e.category)})</span>
                    <strong>{e.co2?.toFixed(2) ?? 'N/A'} kg CO₂</strong>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No activities logged yet.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// Helper function to get unit based on category for display
const getUnit = (category) => {
    if (category === 'travel') return 'km';
    if (category === 'home') return 'kWh';
    if (category === 'food') return 'servings';
    return '';
};


export default Dashboard;
