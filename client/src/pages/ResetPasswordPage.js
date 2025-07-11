import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Container, Card } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import './AuthPage.css';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isTokenValid, setIsTokenValid] = useState(true);

  useEffect(() => {
    // Token geçerlilik kontrolü yapmaya gerek yok, bu sadece şifre sıfırlama sırasında 
    // yapılacak. Kullanıcının direkt buraya erişmesinde sorun yok.
    if (!token) {
      setIsTokenValid(false);
      setError('Geçersiz veya eksik şifre sıfırlama bağlantısı.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      setError('Lütfen tüm alanları doldurunuz.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor.');
      return;
    }

    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      setMessage('');
      
      // API çağrısı yaparken tam URL kullanılıyor (API_BASE_URL'den yararlanarak)
      const response = await fetch(`${API_BASE_URL}/api/users/auth/reset-password/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password, confirmPassword }),
        credentials: 'include'
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.msg || data.errors?.[0]?.msg || 'Şifre sıfırlama işleminde bir hata oluştu.');
      }
      
      // Başarılı
      setMessage(data.msg || 'Şifreniz başarıyla sıfırlandı.');
      setPassword('');
      setConfirmPassword('');
      
      // Kullanıcıyı 3 saniye sonra giriş sayfasına yönlendir
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (error) {
      setError(error.message || 'Bir hata oluştu. Lütfen tekrar deneyin.');
      console.error('Şifre sıfırlama hatası:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isTokenValid) {
    return (
      <Container className="auth-container mt-5">
        <Card className="auth-card shadow">
          <Card.Body>
            <h2 className="text-center mb-4">Şifre Sıfırlama Hatası</h2>
            <Alert variant="danger">
              {error || 'Geçersiz veya eksik şifre sıfırlama bağlantısı.'}
            </Alert>
            <div className="d-flex justify-content-center mt-3">
              <Button variant="primary" href="/forgot-password">
                Yeni Şifre Sıfırlama Bağlantısı Talep Et
              </Button>
            </div>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="auth-container mt-5">
      <Card className="auth-card shadow">
        <Card.Body>
          <h2 className="text-center mb-4">Yeni Şifre Belirleme</h2>
          
          {message && <Alert variant="success">{message}</Alert>}
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Form.Group controlId="password" className="mb-3">
              <Form.Label>Yeni Şifre</Form.Label>
              <Form.Control
                type="password"
                placeholder="Yeni şifrenizi girin"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength="6"
              />
              <Form.Text className="text-muted">
                Şifreniz en az 6 karakter olmalıdır.
              </Form.Text>
            </Form.Group>

            <Form.Group controlId="confirmPassword" className="mb-3">
              <Form.Label>Şifreyi Onaylayın</Form.Label>
              <Form.Control
                type="password"
                placeholder="Şifrenizi tekrar girin"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength="6"
              />
            </Form.Group>

            <div className="d-flex flex-column mt-4">
              <Button 
                variant="primary" 
                type="submit" 
                className="w-100 mb-3" 
                disabled={isLoading}
              >
                {isLoading ? 'İşleniyor...' : 'Şifreyi Sıfırla'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ResetPasswordPage;
