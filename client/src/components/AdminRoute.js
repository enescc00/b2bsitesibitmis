import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function AdminRoute({ children }) {
  const { user, authToken, loading } = useContext(AuthContext);
  const location = useLocation();

  // 1. AuthContext'in token'ı kontrol etme işi bitene kadar bekle
  if (loading) {
    return <div>Yükleniyor...</div>; // Veya bir "spinner" animasyonu
  }

  // 2. Yüklenme bittikten sonra kontrolleri yap
  if (!authToken || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/" replace />; 
  }

  // 3. Her şey yolundaysa, sayfayı göster
  return children;
}

export default AdminRoute;