import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function AdminRoute({ children }) {
  const { user, authToken } = useContext(AuthContext);
  const location = useLocation();

  if (!authToken || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/" replace />; // Admin değilse anasayfaya yönlendir
  }

  return children;
}

export default AdminRoute;