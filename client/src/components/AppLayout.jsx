import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './AppLayout.module.css';

function AppLayout({ title, subtitle, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <p className={styles.brand}>SmartBasket Analytics</p>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        <div className={styles.headerRight}>
          <span className={styles.userBadge}>{user?.role}</span>
          <button className={styles.logoutButton} type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <nav className={styles.nav}>
        <NavLink
          to="/dashboard"
          className={({ isActive }) => (isActive ? styles.navLinkActive : styles.navLink)}
        >
          Dashboard
        </NavLink>
        <NavLink
          to="/items"
          className={({ isActive }) => (isActive ? styles.navLinkActive : styles.navLink)}
        >
          Items
        </NavLink>
        <NavLink
          to="/billing"
          className={({ isActive }) => (isActive ? styles.navLinkActive : styles.navLink)}
        >
          Billing
        </NavLink>
        <NavLink
          to="/itemsets"
          className={({ isActive }) => (isActive ? styles.navLinkActive : styles.navLink)}
        >
          Itemsets
        </NavLink>
        <NavLink
          to="/rules"
          className={({ isActive }) => (isActive ? styles.navLinkActive : styles.navLink)}
        >
          Rules
        </NavLink>
      </nav>

      <main className={styles.content}>{children}</main>
    </div>
  );
}

export default AppLayout;
