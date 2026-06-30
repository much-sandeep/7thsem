import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import DailySalesChart from '../components/DailySalesChart';
import TopItemsChart from '../components/TopItemsChart';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import styles from './DashboardPage.module.css';

function formatCurrency(value) {
  return `$${Number(value).toFixed(2)}`;
}

function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [dailySales, setDailySales] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [summaryData, dailyData, topData] = await Promise.all([
        api.getDashboardSummary(),
        api.getDashboardDailySales(),
        api.getDashboardTopItems(),
      ]);
      setSummary(summaryData);
      setDailySales(dailyData.dailySales);
      setTopItems(topData.topItems);
    } catch (err) {
      setError(err.data?.error || 'Failed to load dashboard analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return (
    <AppLayout title="Dashboard" subtitle={`Welcome, ${user?.username}`}>
      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <p className={styles.loading}>Loading analytics...</p>
      ) : (
        <>
          <section className={styles.statsGrid}>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Total Revenue</p>
              <p className={styles.statValue}>
                {formatCurrency(summary?.totalRevenue ?? 0)}
              </p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Total Bills</p>
              <p className={styles.statValue}>{summary?.totalBills ?? 0}</p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Items Sold</p>
              <p className={styles.statValue}>{summary?.totalItemsSold ?? 0}</p>
            </div>
          </section>

          <section className={styles.chartsGrid}>
            <DailySalesChart dailySales={dailySales} />
            <TopItemsChart topItems={topItems} />
          </section>
        </>
      )}

      <section className={styles.linksGrid}>
        <Link to="/items" className={styles.linkCard}>
          <h2 className={styles.linkTitle}>Items</h2>
          <p className={styles.linkText}>Manage or view the product catalog</p>
        </Link>
        <Link to="/billing" className={styles.linkCard}>
          <h2 className={styles.linkTitle}>Billing</h2>
          <p className={styles.linkText}>Create new sales and invoices</p>
        </Link>
      </section>
    </AppLayout>
  );
}

export default DashboardPage;
