import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import './Navbar.css';

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const { cartItems } = useContext(CartContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/'); 
  };

  const totalCartItems = cartItems.reduce((acc, item) => acc + item.qty, 0);

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">B2B Platform</Link>
      <div className="nav-links">
        <Link to="/products" className="nav-link">Ürünler</Link>
        <Link to="/cart" className="nav-link">
          Sepet <span className="cart-badge">{totalCartItems}</span>
        </Link>
        
        {/* === KULLANICI GİRİŞ DURUMUNA GÖRE DEĞİŞEN BÖLÜM === */}
        {user ? (
          // Giriş yapıldıysa: Açılır menü göster
          <div className="account-menu">
            <div className="account-menu-trigger">
              <span className="nav-link">Hesabım ({user.name})</span>
              <span className="arrow-down">&#9662;</span>
            </div>
            <div className="dropdown-content">
              <Link to="/profile/orders" className="dropdown-link">Siparişlerim</Link>
              <Link to="/profile/info" className="dropdown-link">Kullanıcı Bilgilerim</Link>
              <button onClick={handleLogout} className="dropdown-link-button">Çıkış Yap</button>
            </div>
          </div>
        ) : (
          // Giriş yapılmadıysa: Giriş Yap linki göster
          <Link to="/login" className="nav-link">Giriş Yap</Link>
        )}
      </div>
    </nav>
  );
}

export default Navbar;