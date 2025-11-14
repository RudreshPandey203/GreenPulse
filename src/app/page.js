'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import Header from '../components/Header';
import EmissionForm from '../components/EmissionForm';
import Dashboard from '../components/Dashboard';
import Auth from '../components/Auth';
import NewsSection from '../components/NewsSection'; // Import new component
import BlogSection from '../components/BlogSection'; // Import new component
import styles from './Home.module.css'; // Existing styles
import pageStyles from './page.module.css'; // New styles for navigation

export default function Home() {
  const [user, setUser] = useState(null);
  const [emissions, setEmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('tracker'); // 'tracker', 'news', 'blog'

  // Effect to handle authentication state
  useEffect(() => {
    setLoading(true); // Start loading when auth state might change
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false); // Stop loading once auth state is confirmed
    });
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Effect to fetch emission data from Firestore when user is logged in
  useEffect(() => {
    let unsubscribeEmissions = null;
    if (user) {
      const q = query(
        collection(db, 'users', user.uid, 'emissions'),
        orderBy('date', 'desc') // Ensure date field exists or change to createdAt
      );
      unsubscribeEmissions = onSnapshot(q, (snapshot) => {
        const emissionsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          // Ensure date objects are handled correctly if needed downstream
          date: doc.data().date?.toDate ? doc.data().date.toDate().toISOString() : doc.data().date,
          createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate().toISOString() : doc.data().createdAt,
        }));
        setEmissions(emissionsData);
      }, (error) => {
          console.error("Error fetching emissions:", error);
          // Handle error appropriately, maybe set an error state
      });
    } else {
      // Clear emissions data when user logs out
      setEmissions([]);
    }
     // Cleanup subscription on unmount or when user changes
    return () => {
        if (unsubscribeEmissions) {
            unsubscribeEmissions();
        }
    };
  }, [user]);

  const renderActiveView = () => {
    switch (activeView) {
      case 'news':
        return <NewsSection />;
      case 'blog':
        return <BlogSection user={user} />;
      case 'tracker':
      default:
        if (loading) {
          return <div className={styles.messageContainer}>Loading Tracker...</div>;
        }
        if (!user) {
           return (
            <div className={styles.messageContainer}>
              <h2>Welcome to GreenPulse Tracker</h2>
              <p>Please sign in to track your carbon footprint.</p>
            </div>
          );
        }
        return (
          <>
            <div className="form-section">
              <EmissionForm userId={user.uid} />
            </div>
            <div className="dashboard-section">
              <Dashboard emissions={emissions} />
            </div>
          </>
        );
    }
  };

  return (
    <>
      <Header />
      <Auth user={user} />
      {/* Navigation */}
      <nav className={pageStyles.navigation}>
        <button
          onClick={() => setActiveView('tracker')}
          className={activeView === 'tracker' ? pageStyles.active : ''}
        >
          👣 Tracker
        </button>
        <button
          onClick={() => setActiveView('news')}
          className={activeView === 'news' ? pageStyles.active : ''}
        >
          📰 News
        </button>
        <button
          onClick={() => setActiveView('blog')}
          className={activeView === 'blog' ? pageStyles.active : ''}
        >
          ✍️ Blog
        </button>
      </nav>

      <main className="main-content">
        <div className={`container ${activeView !== 'tracker' ? pageStyles.fullWidthContainer : ''}`}>
           {renderActiveView()}
        </div>
      </main>
    </>
  );
}
