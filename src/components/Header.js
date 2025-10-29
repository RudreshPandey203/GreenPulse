import styles from './Header.module.css';

const Header = () => {
  return (
    <header className={styles.header}>
      <h1>🌿 GreenPulse</h1>
      <p>Track, Talk, and Travel Green</p>
    </header>
  );
};

export default Header;