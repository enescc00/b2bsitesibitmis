import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Bileşenler ve Sayfalar...
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import AdminLayout from './components/admin/AdminLayout';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import MyOrdersPage from './pages/profile/MyOrdersPage';
import UserInfoPage from './pages/profile/UserInfoPage';
import DashboardPage from './pages/admin/DashboardPage';
import UserListPage from './pages/admin/UserListPage';
import UserEditPage from './pages/admin/UserEditPage';
import ProductListPage from './pages/admin/ProductListPage';
import ProductEditPage from './pages/admin/ProductEditPage';
import OrderListPage from './pages/admin/OrderListPage';
import CategoryListPage from './pages/admin/CategoryListPage'; // YENİ
import CategoryEditPage from './pages/admin/CategoryEditPage'; // YENİ

import './App.css';

function App() {
  return (
    <Router>
      <Navbar />
      <main>
        <Routes>
          {/* ... Genel ve Kullanıcı Rotaları ... */}
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
          <Route path="/profile/orders" element={<ProtectedRoute><MyOrdersPage /></ProtectedRoute>} />
          <Route path="/profile/info" element={<ProtectedRoute><UserInfoPage /></ProtectedRoute>} />
          
          <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route index element={<DashboardPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="users" element={<UserListPage />} />
            <Route path="user/:id" element={<UserEditPage />} />
            <Route path="products" element={<ProductListPage />} />
            <Route path="product/new" element={<ProductEditPage />} />
            <Route path="product/:id" element={<ProductEditPage />} />
            <Route path="orders" element={<OrderListPage />} />
            <Route path="categories" element={<CategoryListPage />} /> {/* YENİ */}
            <Route path="category/new" element={<CategoryEditPage />} /> {/* YENİ */}
            <Route path="category/:id" element={<CategoryEditPage />} /> {/* YENİ */}
          </Route>
        </Routes>
      </main>
    </Router>
  );
}

export default App;