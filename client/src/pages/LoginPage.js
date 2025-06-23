import React, { useState, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './LoginPage.css';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.msg || 'Giriş yapılamadı.');
      }
      if (data.token) {
        login(data.token);
        // Token içindeki role bilgisini çözümle
        const decoded = jwtDecode(data.token);
        const role = decoded.user.role;
        let targetPath = '/';
        if (role === 'admin') targetPath = '/admin/dashboard';
        else if (role === 'sales_rep') targetPath = '/sales-rep/dashboard';
        else targetPath = from;
        navigate(targetPath, { replace: true });
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-welcome-panel">
        {/* === DEĞİŞİKLİK 1: Yazı yerine logo eklendi === */}
        <img 
            src="https://www.curkuslar.com.tr/wp-content/uploads/2021/10/CMS-LOGO-380.png" 
            alt="Bay Yazılım Logo" 
            className="login-logo-img"
        />
        <h2>Hoşgeldiniz</h2>
        {/* === DEĞİŞİKLİK 2: Demo bilgi kutusu kaldırıldı === */}
      </div>
      <div className="login-form-panel">
        <div className="login-form-container">
          <form onSubmit={handleSubmit} className="auth-form">
            <h2>BAYİ GİRİŞİ</h2>
            {error && <p className="error-message">{error}</p>}
            <div className="form-group">
              <label htmlFor="email">Kullanıcı Adı *</label>
              <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="password">Şifre *</label>
              <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="form-options">
                <Link to="/forgot-password">Şifremi Unuttum?</Link>
            </div>
            <button type="submit" className="submit-btn">Giriş Yap</button>
            <div className="form-divider"><span>VEYA</span></div>
            <Link to="/register" className="register-btn">Yeni Hesap Oluştur</Link>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;