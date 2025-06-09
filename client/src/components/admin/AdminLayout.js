import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import './AdminLayout.css';

function AdminLayout() {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <nav>
          <NavLink to="/admin/dashboard">Gösterge Paneli</NavLink>
          <NavLink to="/admin/users">Müşteriler</NavLink>
          <NavLink to="/admin/products">Ürünler</NavLink>
          <NavLink to="/admin/orders">Siparişler</NavLink>
          <NavLink to="/admin/categories">Kategoriler</NavLink>
        </nav>
      </aside>
      <main className="admin-main-content">
        <Outlet /> {/* Burası, iç içe geçmiş rotaların (dashboard, users vs.) render edileceği yer */}
      </main>
    </div>
  );
}

export default AdminLayout;