// API istekleri için merkezi yardımcı fonksiyon
import { API_BASE_URL } from '../config/api';

/**
 * API isteği yapmak için kullanılan merkezi fonksiyon.
 * Bu fonksiyon, tüm API çağrılarının tutarlı bir şekilde yapılmasını sağlar.
 * 
 * @param {string} endpoint - API endpoint'i (örn: '/users/auth/login')
 * @param {Object} options - Fetch API için options nesnesi
 * @returns {Promise} - Fetch API yanıtını döndürür
 */
export const apiRequest = async (endpoint, options = {}) => {
  // Endpoint'in başında / olup olmadığını kontrol et
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // API yolunun başında /api olup olmadığını kontrol et
  const apiPath = normalizedEndpoint.startsWith('/api') ? normalizedEndpoint : `/api${normalizedEndpoint}`;
  
  // Tam URL oluştur
  const url = `${API_BASE_URL}${apiPath}`;
  
  // Default headers ve credentials ekle
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    credentials: 'include',
  };
  
  // Options'ları birleştir
  const fetchOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...(options.headers || {}),
    }
  };
  
  console.log(`API isteği yapılıyor: ${url}`);
  
  try {
    const response = await fetch(url, fetchOptions);
    
    // API hataları için özel işleme
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API hatası:', errorData);
      throw new Error(errorData.message || errorData.msg || `API hatası: ${response.status}`);
    }
    
    return response;
  } catch (error) {
    console.error('API isteği başarısız:', error);
    throw error;
  }
};

export default apiRequest;
