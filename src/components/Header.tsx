import styles from './Header.module.css';

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <div className={styles.logo}>S</div>
        <div className={styles.brandText}>
          <span className={styles.brandName}>SuiteOS</span>
          <span className={styles.brandSub}>Live demo — actions on one screen sync to the others</span>
        </div>
      </div>

      <nav className={styles.nav}>
        <div className={styles.navItem}>
          <span className={styles.navLabel}>Room 204</span>
          <span className={styles.navSub}>GUEST TABLET</span>
        </div>
        <div className={styles.navItem}>
          <span className={styles.navLabel}>Kitchen</span>
          <span className={styles.navSub}>KITCHEN DISPLAY</span>
        </div>
        <div className={`${styles.navItem} ${styles.navActive}`}>
          <span className={styles.navLabel}>Reception</span>
          <span className={styles.navSub}>FRONT DESK</span>
        </div>
      </nav>
    </header>
  );
}
