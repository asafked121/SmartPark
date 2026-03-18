const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const res = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

export const api = {
  // Auth
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (email, password, role) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, role }) }),
  getMe: () => request('/auth/me'),

  // Vehicles
  getVehicles: () => request('/vehicles'),
  addVehicle: (data) =>
    request('/vehicles', { method: 'POST', body: JSON.stringify(data) }),
  deleteVehicle: (id) =>
    request(`/vehicles/${id}`, { method: 'DELETE' }),

  // Lots
  getLots: () => request('/lots'),
  getLot: (id) => request(`/lots/${id}`),
  getSlots: (lotId, startTime, endTime) => {
    let url = `/lots/${lotId}/slots`;
    if (startTime && endTime) {
      url += `?start_time=${encodeURIComponent(startTime)}&end_time=${encodeURIComponent(endTime)}`;
    }
    return request(url);
  },

  // Reservations
  getReservations: () => request('/reservations'),
  createReservation: (data) =>
    request('/reservations', { method: 'POST', body: JSON.stringify(data) }),
  cancelReservation: (id) =>
    request(`/reservations/${id}/cancel`, { method: 'PATCH' }),

  // Payments
  getPayments: () => request('/payments'),
  processPayment: (id) =>
    request(`/payments/${id}/pay`, { method: 'PATCH' }),

  // Admin
  getOccupancy: () => request('/admin/occupancy'),
  getRevenue: () => request('/admin/revenue'),
  getAllReservations: (filters) => {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.lot_id) params.set('lot_id', filters.lot_id);
    const qs = params.toString();
    return request(`/admin/reservations${qs ? `?${qs}` : ''}`);
  },
};
