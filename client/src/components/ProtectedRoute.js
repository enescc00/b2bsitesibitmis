import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function ProtectedRoute({ children }) {
  const { user, authToken } = useContext(AuthContext);
  const location = useLocation();

  // Token veya kullanıcı bilgisi yoksa, giriş sayfasına yönlendir.
  // Nereden geldiği bilgisini (location) de gönderelim ki,
  // giriş yaptıktan sonra kaldığı yere geri dönebilsin.
  if (!authToken || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Giriş yapılmışsa, istenen sayfayı göster.
  return children;
}

export default ProtectedRoute;