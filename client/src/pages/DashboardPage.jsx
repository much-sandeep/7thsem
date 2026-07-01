import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import DailySalesChart from '../components/DailySalesChart';
import ItemFrequencyChart from '../components/ItemFrequencyChart';
import TopItemsChart from '../components/TopItemsChart';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { formatCurrency } from '../utils/formatCurrency';
import styles from './DashboardPage.module.css';

/**
 * Aggregate raw bills into a last-7-days sales series for the trend chart.
 * Days with no sales are kept at zero so the line always spans a full week.
 */
function buildWeeklySales(bills) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const keyOf = (value) => {
    const d = new Date(value);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  };

  const days = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d);
  }

  const totals = new Map(days.map((d) => [keyOf(d), 0]));

  for (const bill of bills) {
    const key = keyOf(bill.date);
    if (totals.has(key)) {
      totals.set(key, totals.get(key) + Number(bill.total_amount));
    }
  }

  return days.map((d) => ({
    date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    totalSales: totals.get(keyOf(d)),
  }));
}

function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [weeklySales, setWeeklySales] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [itemsets, setItemsets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [summaryData, billsData, topData, itemsetsData] = await Promise.all([
        api.getDashboardSummary(),
        api.getBills(),
        api.getDashboardTopItems(),
        api.getFrequentItemsets(),
      ]);
      setSummary(summaryData);
      setWeeklySales(buildWeeklySales(billsData.bills ?? []));
      setTopItems(topData.topItems ?? []);
      setItemsets(itemsetsData.itemsets ?? []);
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
        <div className={styles.loadingWrap}>
          <span className={styles.spinner} aria-hidden="true" />
          <p className={styles.loading}>Loading analytics...</p>
        </div>
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

          <h2 className={styles.sectionTitle}>Analytics</h2>
          <section className={styles.chartsGrid}>
            <div className={styles.chartWide}>
              <DailySalesChart dailySales={weeklySales} />
            </div>
            <TopItemsChart topItems={topItems} />
            <ItemFrequencyChart itemsets={itemsets} />
          </section>
        </>
      )}

      <h2 className={styles.sectionTitle}>Quick Actions</h2>
      <section className={styles.linksGrid}>
        <Link to="/items" className={styles.linkCard}>
          <h2 className={styles.linkTitle}>Items</h2>
          <p className={styles.linkText}>Manage or view the product catalog</p>
        </Link>
        <Link to="/billing" className={styles.linkCard}>
          <h2 className={styles.linkTitle}>Billing</h2>
          <p className={styles.linkText}>Create new sales and invoices</p>
        </Link>
        <Link to="/itemsets" className={styles.linkCard}>
          <h2 className={styles.linkTitle}>Itemsets</h2>
          <p className={styles.linkText}>Explore frequent product combinations</p>
        </Link>
        <Link to="/rules" className={styles.linkCard}>
          <h2 className={styles.linkTitle}>Rules</h2>
          <p className={styles.linkText}>See association rules and lift</p>
        </Link>
      </section>
    </AppLayout>
  );
}

export default DashboardPage;
