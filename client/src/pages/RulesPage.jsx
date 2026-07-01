import { useCallback, useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import api from '../services/api';
import styles from './RulesPage.module.css';

function liftClass(lift) {
  if (lift > 1) return styles.liftPositive;
  if (lift < 1 && lift > 0) return styles.liftNegative;
  return styles.liftNeutral;
}

function RulesPage() {
  const [rules, setRules] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRules = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getAssociationRules();
      setRules(Array.isArray(data.rules) ? data.rules : []);
      setMeta({
        totalTransactions: data.totalTransactions,
        count: data.count,
        minConfidence: data.config?.minConfidence,
      });
    } catch (err) {
      setError(err.data?.error || 'Failed to load association rules');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  return (
    <AppLayout
      title="Association Rules"
      subtitle="If-then buying patterns derived from frequent itemsets"
    >
      {meta && (
        <div className={styles.statBar}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{meta.count ?? 0}</span>
            <span className={styles.statLabel}>Rules</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{meta.totalTransactions ?? 0}</span>
            <span className={styles.statLabel}>Transactions</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>
              {meta.minConfidence != null
                ? `${(Number(meta.minConfidence) * 100).toFixed(0)}%`
                : '—'}
            </span>
            <span className={styles.statLabel}>Min Confidence</span>
          </div>
        </div>
      )}

      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <p className={styles.loading}>Loading rules...</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Rule</th>
                <th className={styles.numeric}>Support</th>
                <th className={styles.numeric}>Confidence</th>
                <th className={styles.numeric}>Lift</th>
              </tr>
            </thead>
            <tbody>
              {rules.length === 0 ? (
                <tr>
                  <td colSpan={4} className={styles.emptyCell}>
                    No association rules found
                  </td>
                </tr>
              ) : (
                rules.map((rule, index) => (
                  <tr key={`${rule.antecedent.join('|')}=>${rule.consequent.join('|')}-${index}`}>
                    <td>
                      <div className={styles.rule}>
                        <div className={styles.itemTags}>
                          {rule.antecedent.map((item) => (
                            <span key={item} className={styles.itemTag}>
                              {item}
                            </span>
                          ))}
                        </div>
                        <span className={styles.arrow}>&rarr;</span>
                        <div className={styles.itemTags}>
                          {rule.consequent.map((item) => (
                            <span key={item} className={styles.consequentTag}>
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className={styles.numeric}>
                      {(Number(rule.support) * 100).toFixed(2)}%
                    </td>
                    <td className={styles.numeric}>
                      {(Number(rule.confidence) * 100).toFixed(2)}%
                    </td>
                    <td className={`${styles.numeric} ${liftClass(Number(rule.lift))}`}>
                      {Number(rule.lift).toFixed(2)}
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

export default RulesPage;
