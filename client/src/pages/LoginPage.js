import React, { useState, useContext } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Form.css';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext); // Artık sadece token'ı kaydetmek için kullanacağız.
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/"; // Girişten sonra nereye yönlendirileceği

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // API isteğini artık doğrudan bu sayfada yapıyoruz.
      const response = await fetch('http://localhost:5001/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || 'Giriş yapılamadı.');
      }
      
      // İstek başarılıysa, AuthContext'teki login fonksiyonunu çağırıp token'ı veriyoruz.
      if (data.token) {
        login(data.token);
        // Kullanıcıyı, gelmiş olduğu sayfaya veya anasayfaya yönlendir.
        navigate(from, { replace: true });
      }

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>Giriş Yap</h2>
        {error && <p className="error-message">{error}</p>}
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Parola</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="submit-btn">Giriş Yap</button>
        <p className="form-footer">
          Hesabınız yok mu? <Link to="/register">Kayıt Olun</Link>
        </p>
      </form>
    </div>
  );
}

export default LoginPage;