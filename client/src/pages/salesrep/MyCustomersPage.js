import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import Modal from '../../components/Modal';
import './MyCustomersPage.css';

// Formun başlangıç state'ini tanımlıyoruz
const initialPaymentState = {
  amount: '',
  description: '',
  paymentMethod: 'Nakit',
  dueDate: '',
};

// === YENİ: İkonlarla birlikte ödeme yöntemleri dizisi ===
const paymentMethods = [
    { name: 'Nakit', icon: 'fas fa-money-bill-wave' },
    { name: 'Kredi Kartı', icon: 'fas fa-credit-card' },
    { name: 'Banka', icon: 'fas fa-landmark' },
    { name: 'Çek', icon: 'fas fa-money-check-alt' },
    { name: 'Senet', icon: 'fas fa-file-signature' }
];

function MyCustomersPage() {
  const [allCustomers, setAllCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [paymentData, setPaymentData] = useState(initialPaymentState);

  const { authToken } = useContext(AuthContext);
  const navigate = useNavigate();

  const fetchCustomers = useCallback(async () => {
    if (!authToken) return;
    setLoading(true);
    setError(''); // Yeni istekte hatayı sıfırla
    try {
      const response = await fetch('/api/salesrep/my-customers', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Müşteriler getirilemedi.');
      }
      // Backend bazen diziyi direkt, bazen { data: [...] } şeklinde dönebilir
      const customersArr = Array.isArray(data) ? data : (data.data || []);
      setAllCustomers(customersArr);
      setFilteredCustomers(customersArr);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [authToken]);
  
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    const results = allCustomers.filter(customer =>
      (customer.name && customer.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (customer.companyTitle && customer.companyTitle.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredCustomers(results);
  }, [searchTerm, allCustomers]);
  
  const handlePaymentDataChange = (e) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenPaymentModal = (customer) => {
    setSelectedCustomer(customer);
    setPaymentData(initialPaymentState);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCustomer(null);
  };
  
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomer || !paymentData.amount) return;

    if ((paymentData.paymentMethod === 'Çek' || paymentData.paymentMethod === 'Senet') && !paymentData.dueDate) {
        toast.error('Lütfen Çek/Senet için bir vade tarihi giriniz.');
        return;
    }

    try {
      const response = await fetch('/api/salesrep/process-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({
          customerId: selectedCustomer._id,
          ...paymentData
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.msg || 'Tahsilat işlemi başarısız.');
      
      toast.success('Tahsilat başarıyla işlendi!');
      handleCloseModal();
      fetchCustomers();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <div className="loading-container">Müşteriler Yükleniyor...</div>;
  if (error) return <div className="error-container">Hata: {error}</div>;

  return (
    <>
      <Modal show={isModalOpen} onClose={handleCloseModal} title={`${selectedCustomer?.name} İçin Tahsilat`}>
        <form onSubmit={handlePaymentSubmit} className="payment-form">
          <div className="form-group">
            <label>Ödeme Yöntemi</label>
            <div className="payment-method-options">
              {/* === DEĞİŞİKLİK: İkonlu dizi map ediliyor === */}
              {paymentMethods.map(method => (
                <label key={method.name}>
                  <input 
                    type="radio" 
                    name="paymentMethod" 
                    value={method.name} 
                    checked={paymentData.paymentMethod === method.name} 
                    onChange={handlePaymentDataChange}
                  />
                  <i className={method.icon}></i>
                  <span>{method.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="amount">Tutar (₺)</label>
            <input 
              type="number" 
              id="amount" 
              name="amount"
              value={paymentData.amount} 
              onChange={handlePaymentDataChange}
              placeholder="0.00"
              step="0.01"
              required 
            />
          </div>

          {(paymentData.paymentMethod === 'Çek' || paymentData.paymentMethod === 'Senet') && (
            <div className="form-group">
              <label htmlFor="dueDate">Vade Tarihi</label>
              <input 
                type="date" 
                id="dueDate"
                name="dueDate"
                value={paymentData.dueDate}
                onChange={handlePaymentDataChange}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="description">Açıklama</label>
            <textarea 
              id="description" 
              name="description"
              rows="3"
              value={paymentData.description}
              onChange={handlePaymentDataChange}
              placeholder="İsteğe bağlı açıklama..."
            ></textarea>
          </div>
          <button type="submit" className="submit-btn">Tahsilatı Kaydet</button>
        </form>
      </Modal>

      <div className="my-customers-page">
        <h1>Müşterilerim</h1>
        <div className="customer-search-bar">
          <input
            type="text"
            placeholder="Müşteri adı veya firma unvanı ile ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Müşteri Adı / Unvan</th>
                <th>Email</th>
                <th>Cari Bakiye</th>
                <th className="action-cell">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map(customer => (
                  <tr key={customer._id}>
                    <td>{customer.companyTitle || customer.name}</td>
                    <td>{customer.email}</td>
                    <td>{customer.currentAccountBalance.toFixed(2)} ₺</td>
                    <td className="action-cell">
                      <button 
                        className="action-btn order-btn" 
                        onClick={() => navigate(`/portal/new-order/${customer._id}`)}
                      >
                        Sipariş Oluştur
                      </button>
                      
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => navigate(`/portal/customers/${customer._id}/statement`)}
                      >
                        Ekstre
                      </button>
                      <button 
                        className="action-btn payment-btn"
                        onClick={() => handleOpenPaymentModal(customer)}
                      >
                        Tahsilat Yap
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>
                    Müşteri bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default MyCustomersPage;