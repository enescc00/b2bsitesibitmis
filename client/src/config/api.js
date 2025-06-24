export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

export const api = {
  salesrep: {
    pendingOrders: `${API_BASE_URL}/api/salesrep/pending-orders`,
    orderAction: (orderId, action) => `${API_BASE_URL}/api/salesrep/orders/${orderId}/${action}`
  },
  // Diğer API endpoint'lerini buraya ekleyebilirsiniz
};

export default api;
