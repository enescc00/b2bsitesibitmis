import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import './ProfileLayout.css';

function ProfileLayout() {
    return (
        <div className="profile-page-container">
            <h1>Hesabım</h1>
            <div className="profile-layout">
                <aside className="profile-sidebar">
                    <nav>
                        <NavLink to="/profile/info">Üyelik Bilgileri</NavLink>
                        <NavLink to="/profile/orders">Siparişlerim</NavLink>
                        <NavLink to="/profile/wishlist">Favorilerim</NavLink>
                        <NavLink to="/profile/statement">Cari Ekstrem</NavLink>
                        <NavLink to="/profile/quotes">Tekliflerim</NavLink>
                        <NavLink to="/new-quote">Yeni Teklif</NavLink>
                    </nav>
                </aside>
                <main className="profile-main-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default ProfileLayout;