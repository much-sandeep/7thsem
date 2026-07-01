import { useCallback, useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import api from '../services/api';
import styles from './ItemsetsPage.module.css';

function ItemsetsPage() {
  const [itemsets, setItemsets] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadItemsets = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getFrequentItemsets();
      setItemsets(Array.isArray(data.itemsets) ? data.itemsets : []);
      setMeta({
        totalTransactions: data.totalTransactions,
        minCount: data.minCount,
        count: data.count,
      });
    } catch (err) {
      setError(err.data?.error || 'Failed to load frequent itemsets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItemsets();
  }, [loadItemsets]);

  return (
    <AppLayout
      title="Frequent Itemsets"
      subtitle="Item combinations that appear together across transactions (FP-Growth)"
    >
      {meta && (
        <div className={styles.statBar}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{meta.count ?? 0}</span>
            <span className={styles.statLabel}>Itemsets</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{meta.totalTransactions ?? 0}</span>
            <span className={styles.statLabel}>Transactions</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{meta.minCount ?? 0}</span>
            <span className={styles.statLabel}>Min Support Count</span>
          </div>
        </div>
      )}

      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <p className={styles.loading}>Loading itemsets...</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Itemset</th>
                <th className={styles.numeric}>Support Count</th>
                <th className={styles.numeric}>Support %</th>
              </tr>
            </thead>
            <tbody>
              {itemsets.length === 0 ? (
                <tr>
                  <td colSpan={3} className={styles.emptyCell}>
                    No frequent itemsets found
                  </td>
                </tr>
              ) : (
                itemsets.map((entry, index) => (
                  <tr key={`${entry.items.join('|')}-${index}`}>
                    <td>
                      <div className={styles.itemTags}>
                        {entry.items.map((item) => (
                          <span key={item} className={styles.itemTag}>
                            {item}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className={styles.numeric}>{entry.support}</td>
                    <td className={styles.numeric}>
                      {Number(entry.supportPercent).toFixed(2)}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </AppLayout>
  );
}

export default ItemsetsPage;
