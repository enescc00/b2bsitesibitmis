// Fetch API için interceptor
import { API_BASE_URL } from '../config/api';

// Orijinal fetch fonksiyonunu saklayalım
const originalFetch = window.fetch;

// Fetch fonksiyonunu geçersiz kılalım (override)
window.fetch = function(url, options = {}) {
  // Eğer URL mutlak bir URL değilse (http veya https ile başlamıyorsa)
  if (url && typeof url === 'string' && !url.startsWith('http')) {
    // Eğer URL "/api" ile başlıyorsa
    if (url.startsWith('/api')) {
      // API_BASE_URL ile tam URL oluştur
      const apiUrl = `${API_BASE_URL}${url}`;
      console.log(`Fetch interceptor: URL dönüştürüldü: ${url} -> ${apiUrl}`);
      url = apiUrl;
    }
  }

  // Options nesnesini düzenleyelim
  const newOptions = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: options?.credentials || 'include', // CORS için cookie desteğini varsayılan yapalım
  };

  // Orijinal fetch fonksiyonunu çağıralım ama dönüş Promise'ini kontrol edelim
  return originalFetch(url, newOptions)
    .then(response => {
      // Response.ok değilse (status 200-299 arası değilse) response'u döndürüp
      // işlemeye devam edelim, hata handling'i çağrı yapan kodda olacak
      return response;
    })
    .catch(error => {
      console.error('Fetch hata oluştu:', error);
      throw error;
    });
};

export default function setupFetchInterceptor() {
  console.log('Fetch interceptor aktif: Tüm API çağrıları merkezi olarak yönetiliyor.');
}
