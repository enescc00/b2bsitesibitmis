import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import './AdminLayout.css';

function AdminLayout() {
  const [isCatalogOpen, setIsCatalogOpen] = useState(true);

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-title">Yönetim Paneli</h1>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/admin/dashboard" className="sidebar-link">
            <i className="fas fa-tachometer-alt"></i>
            <span>Gösterge Paneli</span>
          </NavLink>
          <NavLink to="/admin/orders" className="sidebar-link">
            <i className="fas fa-box-open"></i>
            <span>Siparişler</span>
          </NavLink>
          <NavLink to="/admin/payments" className="sidebar-link">
            <i className="fas fa-credit-card"></i>
            <span>Ödeme Takip</span>
          </NavLink>
          <NavLink to="/admin/quotes" className="sidebar-link">
            <i className="fas fa-file-invoice-dollar"></i>
            <span>Teklifler</span>
          </NavLink>
          <NavLink to="/admin/backorders" className="sidebar-link">
            <i className="fas fa-archive"></i>
            <span>Eksik Ürünler</span>
          </NavLink>
          
          <hr className="sidebar-divider" />

          <div className="sidebar-menu-item">
            <button onClick={() => setIsCatalogOpen(!isCatalogOpen)} className="sidebar-link collapsible">
              <i className="fas fa-book-open"></i>
              <span>Katalog</span>
              <i className={`fas fa-chevron-down dropdown-icon ${isCatalogOpen ? 'open' : ''}`}></i>
            </button>
            {isCatalogOpen && (
              <div className="collapsible-content">
                <NavLink to="/admin/products" className="sidebar-link sub-link">
                  <i className="fas fa-tshirt"></i>
                  <span>Satış Ürünleri</span>
                </NavLink>
                <NavLink to="/admin/product-trees" className="sidebar-link sub-link">
                  <i className="fas fa-sitemap"></i>
                  <span>Ürün Ağaçları</span>
                </NavLink>
                <NavLink to="/admin/inventory" className="sidebar-link sub-link">
                  <i className="fas fa-cubes"></i>
                  <span>Stok Yönetimi</span>
                </NavLink>
                <NavLink to="/admin/categories" className="sidebar-link sub-link">
                  <i className="fas fa-folder-open"></i>
                  <span>Kategoriler</span>
                </NavLink>
              </div>
            )}
          </div>

          <hr className="sidebar-divider" />

          <NavLink to="/admin/users" className="sidebar-link">
            <i className="fas fa-users"></i>
            <span>Müşteriler</span>
          </NavLink>
          <NavLink to="/admin/pricelists" className="sidebar-link">
            <i className="fas fa-tags"></i>
            <span>Fiyat Listeleri</span>
          </NavLink>
          <NavLink to="/admin/settings" className="sidebar-link">
            <i className="fas fa-cog"></i>
            <span>Ayarlar</span>
          </NavLink>

          <a href="/" target="_blank" rel="noopener noreferrer" className="sidebar-link store-link">
            <i className="fas fa-store"></i>
            <span>Mağazayı Görüntüle</span>
          </a>
        </nav>
      </aside>
      <main className="admin-main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;