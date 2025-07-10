import React, { useState, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './AuthPage.css';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/users/auth/login', {
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-body">
      <img 
        src="https://www.curkuslar.com.tr/wp-content/uploads/2021/10/CMS-LOGO-380.png" 
        alt="Logo"
        className="login-page-logo"
      />
      <div className="ring">
        <i style={{'--clr': '#00ff0a'}}></i>
        <i style={{'--clr': '#ff0057'}}></i>
        <i style={{'--clr': '#fffd44'}}></i>
        <div className="login">
          <h2>Bayi Girişi</h2>
          <form onSubmit={handleSubmit}>
            {error && <p className="login-error-message">{error}</p>}
            <div className="inputBx">
              <input 
                type="email" 
                placeholder="E-posta"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="inputBx">
              <input 
                type="password" 
                placeholder="Şifre"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="inputBx">
              <input 
                type="submit" 
                value={loading ? "Giriş..." : "Giriş Yap"} 
                disabled={loading}
              />
            </div>
          </form>
        </div>
      </div>
      <div className="links">
        <Link to="/forgot-password">Şifremi Unuttum</Link>
        <Link to="/register">Kayıt Ol</Link>
      </div>
    </div>
  );
}

export default LoginPage;