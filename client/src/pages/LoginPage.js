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
    }
  };

  return (
    <div className="login-page-container">
      <div className="glass-form-container">
        <h2>Bayi Girişi</h2>
        <form onSubmit={handleSubmit}>
          {error && <p className="login-error-message">{error}</p>}
          <div className="login-form-group">
            <input
              type="email"
              className="login-input"
              placeholder="E-posta Adresi"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="login-form-group">
            <input
              type="password"
              className="login-input"
              placeholder="Şifre"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="login-button">
            Giriş Yap
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;