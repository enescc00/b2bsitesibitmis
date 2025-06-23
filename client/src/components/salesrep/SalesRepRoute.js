import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

/**
 * SalesRepRoute Bileşeni
 * * Bu bileşen, içerisine aldığı sayfaları (children) sadece rolü 'sales_rep' veya 'admin' olan
 * kullanıcıların görebilmesini sağlar. Yetkisiz kullanıcıları yönlendirir.
 * * @param {object} props - React bileşen props'ları
 * @param {React.ReactNode} props.children - Korumalı rota içinde render edilecek olan bileşenler
 */
function SalesRepRoute({ children }) {
  // AuthContext'ten kullanıcı bilgilerini ve yüklenme durumunu alıyoruz.
  const { user, authToken, loading } = useContext(AuthContext);
  const location = useLocation();

  // AuthContext token'ı kontrol ederken bekleme durumu.
  // Bu, sayfa ilk yüklendiğinde kullanıcı bilgisi gelmeden yönlendirme yapılmasını önler.
  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  // Eğer token veya kullanıcı bilgisi yoksa, giriş sayfasına yönlendir.
  // Kullanıcının gelmek istediği sayfayı (location) state olarak gönderiyoruz ki,
  // giriş yaptıktan sonra kaldığı yerden devam edebilsin.
  if (!authToken || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Eğer kullanıcının rolü 'sales_rep' veya 'admin' değilse, ana sayfaya yönlendir.
  // Adminlerin de bu sayfaları görebilmesi test ve yönetim kolaylığı sağlar.
  if (user.role !== 'sales_rep' && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // Tüm kontrollerden geçerse, istenen sayfayı (children) göster.
  return children;
}

export default SalesRepRoute;