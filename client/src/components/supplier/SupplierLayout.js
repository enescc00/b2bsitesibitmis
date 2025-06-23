import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import DashboardPage from '../../pages/supplier/DashboardPage';
import ProductListPage from '../../pages/supplier/ProductListPage';
import OrdersPage from '../../pages/supplier/OrdersPage';
import './SupplierLayout.css';

function SupplierLayout() {
  const [isProductOpen, setIsProductOpen] = useState(true);

  return (
    <div className="supplier-layout">
      <aside className="supplier-sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-title">Tedarikçi Paneli</h1>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/supplier/dashboard" className="sidebar-link">
            <i className="fas fa-chart-line"></i>
            <span>Gösterge Paneli</span>
          </NavLink>

          <div className="sidebar-menu-item">
            <button onClick={() => setIsProductOpen(!isProductOpen)} className="sidebar-link collapsible">
              <i className="fas fa-box"></i>
              <span>Ürünlerim</span>
              <i className={`fas fa-chevron-down dropdown-icon ${isProductOpen ? 'open' : ''}`}></i>
            </button>
            {isProductOpen && (
              <div className="collapsible-content">
                <NavLink to="/supplier/products" className="sidebar-link sub-link">
                  <i className="fas fa-list"></i>
                  <span>Tüm Ürünler</span>
                </NavLink>
                <NavLink to="/supplier/product/new" className="sidebar-link sub-link">
                  <i className="fas fa-plus"></i>
                  <span>Yeni Ürün</span>
                </NavLink>
              </div>
            )}
          </div>

          <NavLink to="/supplier/orders" className="sidebar-link">
            <i className="fas fa-shopping-bag"></i>
            <span>Siparişlerim</span>
          </NavLink>
          <NavLink to="/supplier/account" className="sidebar-link">
            <i className="fas fa-wallet"></i>
            <span>Cari</span>
          </NavLink>
        </nav>
      </aside>
      <main className="supplier-main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default SupplierLayout;
