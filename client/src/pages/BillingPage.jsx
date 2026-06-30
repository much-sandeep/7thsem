import { useCallback, useEffect, useMemo, useState } from 'react';
import AppLayout from '../components/AppLayout';
import api from '../services/api';
import styles from './BillingPage.module.css';

function formatMoney(value) {
  return `$${Number(value).toFixed(2)}`;
}

function BillingPage() {
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [cashReceived, setCashReceived] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [invoice, setInvoice] = useState(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getItems();
      setItems(data.items);
    } catch (err) {
      setError(err.data?.error || 'Failed to load items');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const totalAmount = useMemo(
    () =>
      cart.reduce((sum, line) => sum + Number(line.price) * line.quantity, 0),
    [cart]
  );

  const changeAmount = useMemo(() => {
    const cash = Number(cashReceived);
    if (Number.isNaN(cash) || cash < totalAmount) {
      return 0;
    }
    return cash - totalAmount;
  }, [cashReceived, totalAmount]);

  const addToCart = (item) => {
    if (item.stock < 1) {
      setError(`${item.name} is out of stock`);
      return;
    }

    setError('');
    setCart((prev) => {
      const existing = prev.find((line) => line.item_id === item.id);
      if (existing) {
        if (existing.quantity >= item.stock) {
          setError(`Only ${item.stock} units available for ${item.name}`);
          return prev;
        }
        return prev.map((line) =>
          line.item_id === item.id
            ? { ...line, quantity: line.quantity + 1 }
            : line
        );
      }
      return [
        ...prev,
        {
          item_id: item.id,
          name: item.name,
          price: Number(item.price),
          stock: item.stock,
          quantity: 1,
        },
      ];
    });
  };

  const updateQuantity = (itemId, quantity) => {
    setError('');
    setCart((prev) =>
      prev
        .map((line) => {
          if (line.item_id !== itemId) {
            return line;
          }
          const nextQty = Math.max(0, quantity);
          if (nextQty > line.stock) {
            setError(`Only ${line.stock} units available for ${line.name}`);
            return { ...line, quantity: line.stock };
          }
          return { ...line, quantity: nextQty };
        })
        .filter((line) => line.quantity > 0)
    );
  };

  const removeFromCart = (itemId) => {
    setCart((prev) => prev.filter((line) => line.item_id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
    setCashReceived('');
    setError('');
  };

  const handleCheckout = async (event) => {
    event.preventDefault();
    setError('');

    if (cart.length === 0) {
      setError('Cart is empty');
      return;
    }

    const cash = Number(cashReceived);
    if (Number.isNaN(cash) || cash < totalAmount) {
      setError('Cash received must cover the total amount');
      return;
    }

    setSubmitting(true);
    try {
      const data = await api.createBill({
        cash_received: cash,
        items: cart.map((line) => ({
          item_id: line.item_id,
          quantity: line.quantity,
        })),
      });

      setInvoice(data.bill);
      clearCart();
      await loadItems();
    } catch (err) {
      setError(err.data?.error || 'Failed to create bill');
    } finally {
      setSubmitting(false);
    }
  };

  const closeInvoice = () => {
    setInvoice(null);
  };

  return (
    <AppLayout title="Billing" subtitle="Create sales and generate invoices">
      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.layout}>
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Products</h2>
            <span>{items.length} items</span>
          </div>

          {loading ? (
            <p className={styles.loading}>Loading products...</p>
          ) : (
            <div className={styles.productGrid}>
              {items.map((item) => (
                <button
                  key={item.id}
                  className={styles.productCard}
                  type="button"
                  onClick={() => addToCart(item)}
                  disabled={item.stock < 1}
                >
                  <span className={styles.productName}>{item.name}</span>
                  <span className={styles.productPrice}>{formatMoney(item.price)}</span>
                  <span className={styles.productStock}>Stock: {item.stock}</span>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Cart</h2>
            {cart.length > 0 && (
              <button className={styles.linkButton} type="button" onClick={clearCart}>
                Clear
              </button>
            )}
          </div>

          {cart.length === 0 ? (
            <p className={styles.emptyCart}>Add products to start a sale</p>
          ) : (
            <>
              <div className={styles.cartList}>
                {cart.map((line) => (
                  <div key={line.item_id} className={styles.cartRow}>
                    <div>
                      <p className={styles.cartName}>{line.name}</p>
                      <p className={styles.cartPrice}>{formatMoney(line.price)} each</p>
                    </div>
                    <div className={styles.cartControls}>
                      <button
                        type="button"
                        className={styles.qtyButton}
                        onClick={() => updateQuantity(line.item_id, line.quantity - 1)}
                      >
                        -
                      </button>
                      <span className={styles.qtyValue}>{line.quantity}</span>
                      <button
                        type="button"
                        className={styles.qtyButton}
                        onClick={() => updateQuantity(line.item_id, line.quantity + 1)}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        className={styles.removeButton}
                        onClick={() => removeFromCart(line.item_id)}
                      >
                        Remove
                      </button>
                    </div>
                    <div className={styles.lineTotal}>
                      {formatMoney(line.price * line.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              <form className={styles.checkoutForm} onSubmit={handleCheckout}>
                <div className={styles.summaryRow}>
                  <span>Total</span>
                  <strong>{formatMoney(totalAmount)}</strong>
                </div>

                <label className={styles.label}>
                  Cash Received
                  <input
                    className={styles.input}
                    type="number"
                    min="0"
                    step="0.01"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    required
                  />
                </label>

                <div className={styles.summaryRow}>
                  <span>Change</span>
                  <strong>{formatMoney(changeAmount)}</strong>
                </div>

                <button className={styles.checkoutButton} type="submit" disabled={submitting}>
                  {submitting ? 'Processing...' : 'Generate Invoice'}
                </button>
              </form>
            </>
          )}
        </section>
      </div>

      {invoice && (
        <div className={styles.overlay}>
          <div className={styles.invoice}>
            <h2 className={styles.invoiceTitle}>Invoice #{invoice.id}</h2>
            <p className={styles.invoiceDate}>
              {new Date(invoice.date).toLocaleString()}
            </p>

            <div className={styles.invoiceItems}>
              {invoice.items.map((line) => (
                <div key={line.id} className={styles.invoiceRow}>
                  <span>
                    {line.name} x {line.quantity}
                  </span>
                  <span>{formatMoney(line.price * line.quantity)}</span>
                </div>
              ))}
            </div>

            <div className={styles.invoiceSummary}>
              <div className={styles.summaryRow}>
                <span>Total</span>
                <strong>{formatMoney(invoice.total_amount)}</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>Cash Received</span>
                <strong>{formatMoney(invoice.cash_received)}</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>Change</span>
                <strong>{formatMoney(invoice.change_amount)}</strong>
              </div>
            </div>

            <button className={styles.checkoutButton} type="button" onClick={closeInvoice}>
              Close
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

export default BillingPage;
