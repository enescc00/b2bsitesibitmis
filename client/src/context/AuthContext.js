import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode'; // Yüklediğimiz paketi import ediyoruz

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