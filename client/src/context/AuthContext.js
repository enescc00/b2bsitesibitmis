import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { API_BASE_URL } from '../config/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Yüklenme durumu için yeni state

  useEffect(() => {
    // Uygulama her yüklendiğinde veya token değiştiğinde bu fonksiyon çalışır
    const initializeUser = () => {
      if (authToken) {
        try {
          const decodedToken = jwtDecode(authToken);
          
          // Token'ın süresinin dolup dolmadığını kontrol et
          const currentTime = Date.now() / 1000;
          if (decodedToken.exp < currentTime) {
            // Token'ın süresi dolmuşsa, logout yap
            logout();
          } else {
            // Token geçerliyse, kullanıcı bilgisini state'e ata
            setUser(decodedToken.user);
          }
        } catch (error) {
          // Token çözülemezse (hatalıysa), logout yap
          console.error("Geçersiz token:", error);
          logout();
        }
      }
      setLoading(false); // Kontroller bitti, yüklenme durumunu kapat
    };
    
    initializeUser();
  }, [authToken]);

  // Global fetch interceptor
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (input, init = {}) => {
      // Varsayılan olarak credentials dahil et
      const newInit = { ...init, credentials: 'include' };
      newInit.headers = {
        ...(init.headers || {}),
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
      };

      // URL yeniden yönlendirme mantığını tamamen yeniden yapılandırma
      let target = input;

      if (typeof target === 'string') {
        // Eski localhost URL'lerini değiştir
        if (target.startsWith('http://localhost:5001')) {
          target = target.replace('http://localhost:5001', API_BASE_URL);
        } 
        // Göreceli yolları işle
        else if (target.startsWith('/')) {
          const baseUrl = API_BASE_URL.replace(/\/$/, ''); // Sondaki slash'i kaldır
          
          // Önce hedef yolu temizle
          let cleanPath = target;
          
          // Yoldaki api önekini kaldırıyoruz, biz ekleyeceğiz
          if (cleanPath.startsWith('/api/')) {
            cleanPath = cleanPath.substring(4); // '/api' kısmını kaldır
          }
          
          // Temizlenmiş yolu birleştirelim
          target = `${baseUrl}/api${cleanPath}`;
          
          // Son kontrol olarak, oluşabilecek url sorunlarını düzelt
          target = target
            .replace(/\/\//g, '/') // Çift slash'leri temizle
            .replace(/:\/(\w)/, '://$1') // Protocol sonrasında tek slash varsa düzelt (http:/)  
            .replace(/\/api\/api\//g, '/api/'); // /api/api/ çiftleşmelerini temizle
        }
      }

      let response = await originalFetch(target, newInit);
      if (response.status === 401) {
        // Access token süresi dolmuş olabilir → refresh dene
        try {
          const refreshRes = await originalFetch(`${API_BASE_URL}/api/users/auth/refresh`, {
            method: 'POST',
            credentials: 'include'
          });
          if (refreshRes.ok) {
            const data = await refreshRes.json();
            login(data.token);
            // İlk isteği token ile tekrar yap
            newInit.headers['Authorization'] = `Bearer ${data.token}`;
            response = await originalFetch(target, newInit);
          } else {
            logout();
          }
        } catch (err) {
          console.error('Token yenileme hatası', err);
          logout();
        }
      }
      return response;
    };
    return () => {
      window.fetch = originalFetch;
    };
  }, [authToken]);

  const login = (token) => {
    localStorage.setItem('token', token);
    setAuthToken(token);
    // Token state'e atandığında useEffect tetiklenecek ve user bilgisi güncellenecek.
  };

  const logout = () => {
    localStorage.removeItem('token');
    setAuthToken(null);
    setUser(null);
  };

  const value = {
    authToken,
    user,
    loading, // AdminRoute'un kullanması için loading durumunu da export ediyoruz
    login,
    logout
  };

  // Yüklenme tamamlanana kadar alt bileşenleri (tüm uygulamayı) render etme
  // Bu, zamanlama sorunlarını tamamen çözer.
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};