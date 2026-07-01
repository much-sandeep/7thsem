import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './LoginPage.module.css';

function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from || '/dashboard';

  if (user) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.data?.error || 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.brandMark} aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="12" width="4" height="8" rx="1.2" fill="currentColor" />
              <rect x="10" y="7" width="4" height="13" rx="1.2" fill="currentColor" />
              <rect x="17" y="3" width="4" height="17" rx="1.2" fill="currentColor" />
            </svg>
          </div>
          <h1 className={styles.title}>SmartBasket Analytics</h1>
          <p className={styles.subtitle}>Sign in to your analytics dashboard</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <div className={styles.error}>{error}</div>}

          <label className={styles.label}>
            Username
            <input
              className={styles.input}
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </label>

          <label className={styles.label}>
            Password
            <input
              className={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          <button className={styles.button} type="submit" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
