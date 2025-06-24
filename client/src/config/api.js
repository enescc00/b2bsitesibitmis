// Temel URL'yi al
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// API_BASE_URL artık API yolunu içermiyor, /api önek mantığını standardize ediyoruz
export const API_BASE_URL = BASE_URL.endsWith('/api') ? BASE_URL.slice(0, -4) : BASE_URL;

export const assetUrl = (path = '') => `${API_BASE_URL}${path}`;

export const api = {
  salesrep: {
    pendingOrders: `${API_BASE_URL}/api/salesrep/pending-orders`,
    orderAction: (orderId, action) => `${API_BASE_URL}/api/salesrep/orders/${orderId}/${action}`
  },
  // Diğer API endpoint'lerini buraya ekleyebilirsiniz
};

export default api;
