import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import './SalesRepLayout.css';

function SalesRepLayout() {
  return (
    <div className="sales-rep-layout">
      <aside className="sales-rep-sidebar">
        <div className="sidebar-header">
          <h4>Pazarlamacı Portalı</h4>
        </div>
        <nav>
          <a href="/" target="_blank" rel="noopener noreferrer" className="view-store-link">
            <i className="fas fa-store"></i>
            <span>Mağazayı Görüntüle</span>
          </a>
          <div className="sidebar-divider"></div>
          
          <NavLink to="/portal/dashboard">
            <i className="fas fa-tachometer-alt"></i>
            <span>Ana Panel</span>
          </NavLink>
          {/* === YENİ LİNK === */}
          <NavLink to="/portal/pending-orders">
            <i className="fas fa-tasks"></i>
            <span>Onay Bekleyen Siparişler</span>
          </NavLink>
          <NavLink to="/portal/customers">
            <i className="fas fa-users"></i>
            <span>Müşterilerim</span>
          </NavLink>
          <NavLink to="/portal/new-order">
            <i className="fas fa-plus-circle"></i>
            <span>Yeni Sipariş</span>
          </NavLink>
          <NavLink to="/portal/create-return">
            <i className="fas fa-undo"></i>
            <span>Müşteri İade Talebi</span>
          </NavLink>
          <NavLink to="/portal/new-quote">
            <i className="fas fa-file-signature"></i>
            <span>Yeni Teklif</span>
          </NavLink>
          <NavLink to="/portal/orders">
            <i className="fas fa-shopping-basket"></i>
            <span>Siparişlerim</span>
          </NavLink>

          <NavLink to="/portal/quotes">
            <i className="far fa-file-alt"></i>
            <span>Tekliflerim</span>
          </NavLink>
          <NavLink to="/portal/cashbox">
            <i className="fas fa-cash-register"></i>
            <span>Kasa Hareketleri</span>
          </NavLink>
        </nav>
      </aside>
      <main className="sales-rep-main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default SalesRepLayout;