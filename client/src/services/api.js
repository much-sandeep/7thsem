const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function request(endpoint, options = {}) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
  } catch {
    const error = new Error(
      'Cannot reach the server. Make sure the backend is running (npm run dev in /server).'
    );
    error.status = 0;
    error.data = { error: error.message };
    throw error;
  }

  const text = await response.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = {
        error: response.ok
          ? 'Unexpected server response'
          : `Server error (${response.status}). Is the backend running on the correct port?`,
      };
    }
  }

  if (!response.ok) {
    const error = new Error(data?.error || `API request failed: ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  health: () => request('/health'),
  login: (username, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  logout: () =>
    request('/auth/logout', {
      method: 'POST',
    }),
  me: () => request('/auth/me'),
  dashboard: () => request('/dashboard'),
  getDashboardSummary: () => request('/dashboard/summary'),
  getDashboardDailySales: () => request('/dashboard/daily-sales'),
  getDashboardTopItems: () => request('/dashboard/top-items'),

  getItems: () => request('/items'),
  getItem: (id) => request(`/items/${id}`),
  createItem: (payload) =>
    request('/items', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateItem: (id, payload) =>
    request(`/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteItem: (id) =>
    request(`/items/${id}`, {
      method: 'DELETE',
    }),

  getBills: () => request('/bills'),
  getBill: (id) => request(`/bills/${id}`),
  createBill: (payload) =>
    request('/bills', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

export default api;
