// API için kullanılacak temel URL
// Doğrudan alan adını sabit olarak tanımlıyoruz böylece ortam değişkeni hataları oluşmayacak
const PRODUCTION_URL = "https://curkuslar.online";
const LOCAL_URL = "http://localhost:5001";

// Üretim ortamında mıyız?
const isProd = process.env.NODE_ENV === "production";

// API_BASE_URL'yi ortama göre ayarla
export const API_BASE_URL = isProd ? PRODUCTION_URL : LOCAL_URL;

console.log("API_BASE_URL:", API_BASE_URL);

export const assetUrl = (path = "") => {
  if (!path) return "";
  if (path.includes("via.placeholder.com")) {
    return "https://placehold.co/300?text=Görsel+Yok";
  } // Eğer zaten mutlak bir URL ise (http veya https ile başlıyorsa) doğrudan döndür
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  // Yoksa API_BASE_URL ile birleştir
  return `${API_BASE_URL}${path}`;
};

export const api = {
  salesrep: {
    pendingOrders: `${API_BASE_URL}/api/salesrep/pending-orders`,
    orderAction: (orderId, action) =>
      `${API_BASE_URL}/api/salesrep/orders/${orderId}/${action}`,
  },
  // Diğer API endpoint'lerini buraya ekleyebilirsiniz
};

export default api;
