/**
 * MongoDB-ready API client for Solohans Delicious Meals
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const getToken = () => localStorage.getItem('solohans_token');
const setToken = (token) => localStorage.setItem('solohans_token', token);
export const clearToken = () => localStorage.removeItem('solohans_token');

const authHeaders = () => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...options.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'API error');
  }
  return res.json();
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────
export const auth = {
  login: async (email, password) => {
    const data = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    if (data.token) setToken(data.token);
    return data;
  },
  logout: () => clearToken(),
  getSession: () => {
    const token = getToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) { clearToken(); return null; }
      return payload;
    } catch { clearToken(); return null; }
  },
  requestPasswordReset: (email) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  requestChangePassword: (currentPassword, newPassword, confirmPassword) =>
    request('/auth/change-password/request', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword, confirmPassword }) }),
  resendChangePasswordOtp: () => request('/auth/change-password/resend', { method: 'POST' }),
  verifyChangePassword: (otp) => request('/auth/change-password/verify', { method: 'POST', body: JSON.stringify({ otp }) }),
};

export const attendance = {
  getToday: () => request('/attendance/today'),
  checkIn: () => request('/attendance/check-in', { method: 'POST' }),
  checkOut: (tasksCompleted) => request('/attendance/check-out', { method: 'POST', body: JSON.stringify({ tasksCompleted }) }),
  getHistory: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/attendance/history${q ? '?' + q : ''}`);
  },
};

export const staff = {
  getAll: () => request('/staff'),
  create: (body) => request('/staff', { method: 'POST', body: JSON.stringify(body) }),
  changeRole: (id, role) => request(`/staff/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
  resetPassword: (id, newPassword) => request(`/staff/${id}/reset-password`, { method: 'PATCH', body: JSON.stringify({ newPassword }) }),
  delete: (id) => request(`/staff/${id}`, { method: 'DELETE' }),
};

export const stock = {
  getToday: () => request('/stock/today'),
  setOpening: (items) => request('/stock/opening', { method: 'POST', body: JSON.stringify({ items }) }),
};

export const reconciliation = {
  getExpected: () => request('/reconciliation/expected'),
  closeDay: (actualCounts) => request('/reconciliation/close-day', { method: 'POST', body: JSON.stringify({ actualCounts }) }),
  getHistory: () => request('/reconciliation/history'),
};

export const auditLogs = {
  getAll: () => request('/audit-logs'),
};

export const expenses = {
  getAll: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/expenses${q ? '?' + q : ''}`);
  },
  create: (body) => request('/expenses', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => request(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id) => request(`/expenses/${id}`, { method: 'DELETE' }),
};

// ─── MENU ITEMS ───────────────────────────────────────────────────────────────
export const menuItems = {
  getAll: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/menu-items${q ? '?' + q : ''}`);
  },
  getSignature: () => request('/menu-items?signature=true&limit=6'),
  create: (body) => request('/menu-items', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => request(`/menu-items/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id) => request(`/menu-items/${id}`, { method: 'DELETE' }),
};

// ─── CATEGORIES ───────────────────────────────────────────────────────────────
export const categories = {
  getAll: () => request('/categories'),
  create: (body) => request('/categories', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id) => request(`/categories/${id}`, { method: 'DELETE' }),
};

// ─── ORDERS ───────────────────────────────────────────────────────────────────
export const orders = {
  create: (body) => request('/orders', { method: 'POST', body: JSON.stringify(body) }),
  getPaymentInfo: ({ order_id, email }) =>
    request(`/orders/payment-info?order_id=${encodeURIComponent(order_id)}&email=${encodeURIComponent(email)}`),
  getAll: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/orders${q ? '?' + q : ''}`);
  },
  getOne: (id) => request(`/orders/${id}`),
  updateStatus: (id, status) => request(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  updatePaymentStatus: (id, payment_status) =>
    request(`/orders/${id}/payment-status`, { method: 'PATCH', body: JSON.stringify({ payment_status }) }),
  updateDeliveryFee: (id, delivery_fee) =>
    request(`/orders/${id}/delivery-fee`, { method: 'PATCH', body: JSON.stringify({ delivery_fee }) }),
  setPaymentStatus: (id, payment_status) => request(`/orders/${id}/payment`, { method: 'PATCH', body: JSON.stringify({ payment_status }) }),
  restore: (id) => request(`/orders/${id}/restore`, { method: 'PATCH' }),
  delete: (id) => request(`/orders/${id}`, { method: 'DELETE' }),          // soft delete
  permanentDelete: (id) => request(`/orders/${id}/permanent`, { method: 'DELETE' }),
};

// ─── CONTACTS ─────────────────────────────────────────────────────────────────
export const contacts = {
  send: (body) => request('/contacts', { method: 'POST', body: JSON.stringify(body) }),
  getAll: () => request('/contacts'),
  sendReply: (id, reply) => request(`/contacts/${id}/reply`, { method: 'PATCH', body: JSON.stringify({ reply }) }),
  delete: (id) => request(`/contacts/${id}`, { method: 'DELETE' }),
};

// ─── REVIEWS ──────────────────────────────────────────────────────────────────
export const reviews = {
  getApproved: () => request('/reviews?status=Approved'),
  getAll: () => request('/reviews'),
  create: (body) => request('/reviews', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => request(`/reviews/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),   // ✅ generic update
  updateStatus: (id, status) => request(`/reviews/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  toggleFeatured: (id, featured) => request(`/reviews/${id}/featured`, { method: 'PATCH', body: JSON.stringify({ featured }) }),
  sendReply: (id, reply) => request(`/reviews/${id}/reply`, { method: 'PATCH', body: JSON.stringify({ reply }) }),
  delete: (id) => request(`/reviews/${id}`, { method: 'DELETE' }),
};

// ─── FILE UPLOAD ──────────────────────────────────────────────────────────────
export const uploadFile = async (file, folder = 'uploads') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);
  const res = await fetch(`${BASE_URL}/upload`, {
    method: 'POST',
    headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : {},
    body: formData,
  });
  if (!res.ok) throw new Error('Upload failed');
  const data = await res.json();
  return data.url;
};

// ─── SETTINGS ────────────────────────────────────────────────────────────────
export const settingsApi = {
  get: () => request('/settings'),
  getAdmin: () => request('/settings/admin'),
  update: (data) => request('/settings', { method: 'PUT', body: JSON.stringify(data) }),
};

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
export const notifications = {
  getAll: () => request('/notifications'),
  markAsRead: (id) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllAsRead: () => request('/notifications/read-all', { method: 'PATCH' }),
  delete: (id) => request(`/notifications/${id}`, { method: 'DELETE' }),
};

// ─── PROMOS ───────────────────────────────────────────────────────────────────
export const promos = {
  getActive: () => request('/promos/active'),
  getAll: () => request('/promos'),
  create: (body) => request('/promos', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => request(`/promos/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  toggle: (id) => request(`/promos/${id}/toggle`, { method: 'PATCH' }),
  delete: (id) => request(`/promos/${id}`, { method: 'DELETE' }),
};

// ─── GALLERY ──────────────────────────────────────────────────────────────────
export const payments = {
  verify: (reference, orderId) =>
    request('/payments/verify', { method: 'POST', body: JSON.stringify({ reference, orderId }) }),
  adminVerify: (reference, orderId) =>
    request('/payments/admin-verify', { method: 'POST', body: JSON.stringify({ reference, orderId }) }),
};

export const deliveryZones = {
  getActive: () => request('/delivery-zones/active'),
  getAll: () => request('/delivery-zones'),
  create: (body) => request('/delivery-zones', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => request(`/delivery-zones/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  toggle: (id) => request(`/delivery-zones/${id}/toggle`, { method: 'PATCH' }),
  delete: (id) => request(`/delivery-zones/${id}`, { method: 'DELETE' }),
};

export const gallery = {
  getPublic: () => request('/gallery'),
  getAdmin: () => request('/gallery/admin'),
  create: (body) => request('/gallery', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => request(`/gallery/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id) => request(`/gallery/${id}`, { method: 'DELETE' }),
};