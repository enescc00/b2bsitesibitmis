import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function SupplierRoute({ children }) {
  const { user, authToken, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  if (!authToken || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.role !== 'supplier') {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default SupplierRoute;
