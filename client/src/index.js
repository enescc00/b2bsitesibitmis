import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext'; // <-- IMPORT ET

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <CartProvider> {/* <-- AUTHPROVIDER'IN İÇİNE EKLE */}
        <App />
      </CartProvider>
    </AuthProvider>
  </React.StrictMode>
);