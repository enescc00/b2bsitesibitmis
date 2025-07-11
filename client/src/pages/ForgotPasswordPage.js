import React, { useState } from 'react';
import { Form, Button, Alert, Container, Card } from 'react-bootstrap';
import { API_BASE_URL } from '../config/api';
import './AuthPage.css';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Lütfen e-posta adresinizi giriniz.');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      setMessage('');
      
      // API çağrısı yaparken tam URL kullanılıyor (API_BASE_URL'den yararlanarak)
      const response = await fetch(`${API_BASE_URL}/api/users/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
        credentials: 'include'
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.msg || 'Şifre sıfırlama talebinde bir hata oluştu.');
      }
      
      // Başarılı
      setMessage(data.msg || 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.');
      setEmail(''); // Formu temizle
      
    } catch (error) {
      setError(error.message || 'Bir hata oluştu. Lütfen tekrar deneyin.');
      console.error('Şifre sıfırlama hatası:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className="auth-container mt-5">
      <Card className="auth-card shadow">
        <Card.Body>
          <h2 className="text-center mb-4">Şifremi Unuttum</h2>
          
          {message && <Alert variant="success">{message}</Alert>}
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Form.Group controlId="email">
              <Form.Label>E-posta Adresiniz</Form.Label>
              <Form.Control
                type="email"
                placeholder="E-posta adresinizi giriniz"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Form.Text className="text-muted">
                Kayıtlı e-posta adresinize şifre sıfırlama bağlantısı gönderilecektir.
              </Form.Text>
            </Form.Group>

            <div className="d-flex flex-column mt-4">
              <Button 
                variant="primary" 
                type="submit" 
                className="w-100 mb-3" 
                disabled={isLoading}
              >
                {isLoading ? 'İşleniyor...' : 'Şifre Sıfırlama Bağlantısı Gönder'}
              </Button>
              
              <Button 
                variant="outline-secondary" 
                href="/login" 
                className="w-100"
              >
                Giriş Sayfasına Dön
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ForgotPasswordPage;
