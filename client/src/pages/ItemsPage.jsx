import { useCallback, useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import styles from './ItemsPage.module.css';

const emptyForm = { name: '', price: '', stock: '' };

function ItemsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

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

  const openCreateForm = () => {
    setEditingItem(null);
    setForm(emptyForm);
    setFormError('');
    setShowForm(true);
  };

  const openEditForm = (item) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      price: String(item.price),
      stock: String(item.stock),
    });
    setFormError('');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingItem(null);
    setForm(emptyForm);
    setFormError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    const name = form.name.trim();
    const price = parseFloat(form.price);
    const stock = parseInt(form.stock, 10);

    if (!name) {
      setFormError('Item name is required');
      return;
    }

    if (Number.isNaN(price) || price < 0) {
      setFormError('Price must be a non-negative number');
      return;
    }

    if (Number.isNaN(stock) || stock < 0 || String(form.stock).includes('.')) {
      setFormError('Stock must be a non-negative whole number');
      return;
    }

    const payload = { name, price, stock };

    setSubmitting(true);

    try {
      if (editingItem) {
        await api.updateItem(editingItem.id, payload);
      } else {
        await api.createItem(payload);
      }
      closeForm();
      try {
        await loadItems();
      } catch (reloadErr) {
        setError(reloadErr.data?.error || 'Item saved, but the list failed to refresh.');
      }
    } catch (err) {
      setFormError(err.data?.error || 'Failed to save item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.name}"?`)) {
      return;
    }

    try {
      await api.deleteItem(item.id);
      await loadItems();
    } catch (err) {
      setError(err.data?.error || 'Failed to delete item');
    }
  };

  return (
    <AppLayout
      title="Items"
      subtitle={isAdmin ? 'Manage product catalog' : 'View product catalog'}
    >
      <div className={styles.toolbar}>
        {isAdmin && (
          <button className={styles.primaryButton} type="button" onClick={openCreateForm}>
            Add Item
          </button>
        )}
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <p className={styles.loading}>Loading items...</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Price</th>
                <th>Stock</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 4 : 3} className={styles.emptyCell}>
                    No items found
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>${Number(item.price).toFixed(2)}</td>
                    <td>{item.stock}</td>
                    {isAdmin && (
                      <td>
                        <div className={styles.actions}>
                          <button
                            className={styles.secondaryButton}
                            type="button"
                            onClick={() => openEditForm(item)}
                          >
                            Edit
                          </button>
                          <button
                            className={styles.dangerButton}
                            type="button"
                            onClick={() => handleDelete(item)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>
              {editingItem ? 'Edit Item' : 'Add Item'}
            </h2>

            <form className={styles.form} onSubmit={handleSubmit}>
              {formError && <div className={styles.error}>{formError}</div>}

              <label className={styles.label}>
                Name
                <input
                  className={styles.input}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </label>

              <label className={styles.label}>
                Price
                <input
                  className={styles.input}
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                />
              </label>

              <label className={styles.label}>
                Stock
                <input
                  className={styles.input}
                  type="number"
                  min="0"
                  step="1"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  required
                />
              </label>

              <div className={styles.modalActions}>
                <button className={styles.secondaryButton} type="button" onClick={closeForm}>
                  Cancel
                </button>
                <button className={styles.primaryButton} type="submit" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

export default ItemsPage;
