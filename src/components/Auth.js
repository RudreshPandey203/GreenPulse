// src/components/Auth.js
'use client';

import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import styles from './Auth.module.css';

export default function Auth({ user }) {
  const auth = getAuth();

  const handleSignIn = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider);
  };

  const handleSignOut = () => {
    signOut(auth);
  };

  return (
    <div className={styles.authContainer}>
      {user ? (
        <div className={styles.userInfo}>
          <p>Welcome, {user.displayName}!</p>
          <button onClick={handleSignOut} className={styles.authButton}>
            Sign Out
          </button>
        </div>
      ) : (
        <button onClick={handleSignIn} className={styles.authButton}>
          Sign in with Google
        </button>
      )}
    </div>
  );
}