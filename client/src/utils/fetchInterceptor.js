// Fetch API için gelişmiş interceptor
import { API_BASE_URL } from '../config/api';

// Hata ayıklama için her URL dönüşümünü loglayalım
const logUrlTransformation = (original, transformed) => {
  console.log(`📡 Fetch çağrısı: ${original} -> ${transformed}`);
};

// URL düzeltme fonksiyonu - Çift /api/api sorununu çözer
const fixApiPath = (path) => {
  // Eğer URL zaten tam bir URL ise (http/https ile başlıyorsa) olduğu gibi döndür
  if (path.startsWith('http')) {
    return path;
  }

  // URL'deki çift /api/api sorununu çöz
  let fixedPath = path;
  if (path.includes('/api/api')) {
    fixedPath = path.replace('/api/api', '/api');
    console.log(`⚠️ Çift API prefix düzeltildi: ${path} -> ${fixedPath}`);
  }

  // Eğer path "/api" ile başlıyorsa, API_BASE_URL ile birleştir
  if (fixedPath.startsWith('/api')) {
    return `${API_BASE_URL}${fixedPath}`;
  }
  
  // Eğer path "/" ile başlıyorsa ama "/api" ile başlamıyorsa, "/api" ekle
  if (fixedPath.startsWith('/') && !fixedPath.startsWith('/api')) {
    return `${API_BASE_URL}/api${fixedPath}`;
  }
  
  // Hiçbir koşula uymayan URL'ler için varsayılan yönetim
  return `${API_BASE_URL}/api/${fixedPath}`;
};

// Orijinal fetch fonksiyonunu saklayalım
const originalFetch = window.fetch;

// Fetch fonksiyonunu geçersiz kılalım (override)
window.fetch = function(url, options = {}) {
  // URL'yi düzeltelim
  let transformedUrl = url;
  if (url && typeof url === 'string') {
    transformedUrl = fixApiPath(url);
    if (url !== transformedUrl) {
      logUrlTransformation(url, transformedUrl);
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

  // FormData varsa Content-Type header'ını kaldır (browser otomatik ekliyor)
  if (options.body instanceof FormData) {
    delete newOptions.headers['Content-Type'];
  }

  // Orijinal fetch fonksiyonunu çağıralım ve dönüş değerini izleyelim
  return originalFetch(transformedUrl, newOptions)
    .then(response => {
      if (!response.ok) {
        console.warn(`🔴 Fetch yanıt hatası: ${response.status} ${response.statusText} - URL: ${transformedUrl}`);
      }
      return response;
    })
    .catch(error => {
      console.error(`🔴 Fetch network hatası: ${error.message} - URL: ${transformedUrl}`, error);
      throw error;
    });
};

export default function setupFetchInterceptor() {
  console.log('Fetch interceptor aktif: Tüm API çağrıları merkezi olarak yönetiliyor.');
}
