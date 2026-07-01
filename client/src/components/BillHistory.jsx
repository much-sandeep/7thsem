import { Fragment, useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import { formatCurrency } from '../utils/formatCurrency';
import styles from './BillHistory.module.css';

function countItems(bill) {
  if (!Array.isArray(bill?.items)) {
    return null;
  }
  return bill.items.reduce((sum, line) => sum + Number(line.quantity || 0), 0);
}

function BillHistory({ refreshKey }) {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const loadBills = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getBills();
      const list = Array.isArray(data?.bills) ? data.bills : [];

      const detailed = await Promise.all(
        list.map(async (bill) => {
          try {
            const detail = await api.getBill(bill.id);
            return { ...bill, ...detail.bill };
          } catch {
            return bill;
          }
        })
      );

      setBills(detailed);
    } catch (err) {
      setError(err.data?.error || 'Failed to load bill history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBills();
  }, [loadBills, refreshKey]);

  const toggleExpanded = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <h2>Bill History</h2>
        <span>{bills.length} bills</span>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <p className={styles.loading}>Loading bill history...</p>
      ) : bills.length === 0 ? (
        <p className={styles.empty}>No bills have been generated yet</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Bill</th>
                <th>Date &amp; Time</th>
                <th className={styles.numeric}>Items</th>
                <th className={styles.numeric}>Total</th>
                <th aria-label="Details" />
              </tr>
            </thead>
            <tbody>
              {bills.map((bill) => {
                const items = countItems(bill);
                const isExpanded = expandedId === bill.id;
                return (
                  <Fragment key={bill.id}>
                    <tr
                      className={styles.row}
                      onClick={() => toggleExpanded(bill.id)}
                    >
                      <td className={styles.billId}>#{bill.id}</td>
                      <td>{new Date(bill.date).toLocaleString()}</td>
                      <td className={styles.numeric}>
                        {items === null ? '—' : items}
                      </td>
                      <td className={styles.numeric}>
                        {formatCurrency(bill.total_amount)}
                      </td>
                      <td className={styles.numeric}>
                        {Array.isArray(bill.items) && bill.items.length > 0 && (
                          <span className={styles.expandHint}>
                            {isExpanded ? 'Hide' : 'View'}
                          </span>
                        )}
                      </td>
                    </tr>
                    {isExpanded && Array.isArray(bill.items) && (
                      <tr className={styles.detailRow}>
                        <td colSpan={5}>
                          <div className={styles.detailBox}>
                            {bill.items.map((line) => (
                              <div key={line.id} className={styles.detailLine}>
                                <span>
                                  {line.name} &times; {line.quantity}
                                </span>
                                <span>
                                  {formatCurrency(
                                    Number(line.price) * Number(line.quantity)
                                  )}
                                </span>
                              </div>
                            ))}
                            <div className={styles.detailSummary}>
                              <span>Cash Received</span>
                              <span>{formatCurrency(bill.cash_received)}</span>
                            </div>
                            <div className={styles.detailSummary}>
                              <span>Change</span>
                              <span>{formatCurrency(bill.change_amount)}</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default BillHistory;
