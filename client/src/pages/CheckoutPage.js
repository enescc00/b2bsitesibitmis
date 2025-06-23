import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import Modal from '../components/Modal';
import AddressForm from '../components/AddressForm';
import PreliminaryInfoText from '../components/legal/PreliminaryInfoText';
import SalesAgreementText from '../components/legal/SalesAgreementText';
import './CheckoutPage.css';

function CheckoutPage() {
  const { user, authToken } = useContext(AuthContext);
  const { cartItems, clearCart } = useContext(CartContext);
  const navigate = useNavigate();

  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Cari Hesap');
  const [isPreInfoModalOpen, setIsPreInfoModalOpen] = useState(false);
  const [isSalesModalOpen, setIsSalesModalOpen] = useState(false);
  const [isTermsAgreed, setIsTermsAgreed] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [newAddress, setNewAddress] = useState({
      addressTitle: 'Yeni Adres', province: '', district: '', fullAddress: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
        navigate('/login?redirect=/checkout');
        return;
    }
    if (cartItems.length === 0) {
      navigate('/cart');
      return;
    }
    if (user && user.addresses && user.addresses.length > 0 && !selectedAddress) {
      setSelectedAddress(user.addresses[0]);
    }
  }, [user, cartItems, navigate, selectedAddress]);
  
  const handleNewAddressChange = (e) => {
    setNewAddress({ ...newAddress, [e.target.name]: e.target.value });
  };
  
  const handleAddNewAddress = async (e) => {
      e.preventDefault();
      setSelectedAddress(newAddress); 
      setIsAddressModalOpen(false);
      toast.info('Teslimat adresi geçici olarak değiştirildi.');
  };

  const placeOrderHandler = async () => {
    if (!selectedAddress) {
        return toast.error('Lütfen bir teslimat adresi seçin veya ekleyin.');
    }
    setLoading(true);
    try {
      const itemsPrice = cartItems.reduce((acc, item) => acc + (item.salePrice || 0) * item.qty, 0);
      const shippingPrice = itemsPrice > 500 ? 0 : 49.90;
      const totalPrice = itemsPrice + shippingPrice;
      const orderData = {
        orderItems: cartItems.map(item => ({ name: item.name, qty: item.qty, price: (item.salePrice || 0), product: item._id })),
        shippingAddress: selectedAddress,
        paymentMethod: paymentMethod,
        totalPrice: totalPrice,
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}`},
        body: JSON.stringify(orderData)
      });
      const createdOrder = await response.json();
      if (!response.ok) throw new Error(createdOrder.msg || 'Sipariş oluşturulamadı.');
      
      clearCart();
      toast.success('Siparişiniz başarıyla alındı!');
      navigate('/'); 
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  if (!user || !selectedAddress) return <div className="loading-container">Yükleniyor...</div>;

  // === DÜZELTME 1: item.price -> item.salePrice olarak değiştirildi ===
  const itemsPrice = cartItems.reduce((acc, item) => acc + (item.salePrice || 0) * item.qty, 0);
  const shippingPrice = itemsPrice > 500 ? 0 : 49.90;
  const totalPrice = itemsPrice + shippingPrice;

  return (
    <>
      <Modal show={isPreInfoModalOpen} onClose={() => setIsPreInfoModalOpen(false)} title="Ön Bilgilendirme Formu">
        <PreliminaryInfoText user={user} cartItems={cartItems} paymentMethod={paymentMethod} totalPrice={totalPrice} />
      </Modal>
      <Modal show={isSalesModalOpen} onClose={() => setIsSalesModalOpen(false)} title="Mesafeli Satış Sözleşmesi">
        <SalesAgreementText user={user} cartItems={cartItems} paymentMethod={paymentMethod} totalPrice={totalPrice} shippingPrice={shippingPrice} selectedAddress={selectedAddress} />
      </Modal>
      <Modal show={isAddressModalOpen} onClose={() => setIsAddressModalOpen(false)} title="Yeni Adres Ekle">
        <AddressForm addressData={newAddress} onAddressChange={handleNewAddressChange} onSubmit={handleAddNewAddress} />
      </Modal>
      <div className="checkout-page">
        <div className="checkout-main">
          <div className="checkout-section">
            <div className="section-header">
                <h3>Teslimat Adresi</h3>
                <button className="change-btn" onClick={() => setIsAddressModalOpen(true)}>Ekle / Değiştir</button>
            </div>
            <div className="address-box selected">
              <p><strong>{selectedAddress.addressTitle}</strong></p>
              <p>{selectedAddress.fullAddress}</p>
              <p>{selectedAddress.district}, {selectedAddress.province}</p>
            </div>
          </div>
          <div className="checkout-section">
            <h3>Ödeme Seçenekleri</h3>
            <div className="payment-options">
                <label className={paymentMethod === 'Cari Hesap' ? 'selected' : ''}>
                    <input type="radio" value="Cari Hesap" checked={paymentMethod === 'Cari Hesap'} onChange={(e) => setPaymentMethod(e.target.value)} /> 
                    Cari Hesaba İşle
                </label>
                <label className={paymentMethod === 'Havale/EFT' ? 'selected' : ''}>
                    <input type="radio" value="Havale/EFT" checked={paymentMethod === 'Havale/EFT'} onChange={(e) => setPaymentMethod(e.target.value)} /> 
                    Havale/EFT
                </label>
                 <label className={`credit-card-option ${paymentMethod === 'Kredi Kartı' ? 'selected' : ''}`}>
                    <input type="radio" value="Kredi Kartı" checked={paymentMethod === 'Kredi Kartı'} onChange={(e) => setPaymentMethod(e.target.value)} />
                    Banka / Kredi Kartı
                    {paymentMethod === 'Kredi Kartı' && (
                        <div className="credit-card-form">
                            <input type="text" placeholder="Kart Numarası"/>
                            <div className="card-details">
                                <input type="text" placeholder="MM/YY"/>
                                <input type="text" placeholder="CVC"/>
                            </div>
                        </div>
                    )}
                 </label>
            </div>
          </div>
         <div className="checkout-section">
            <h3>Teslim Edilecek Ürünler</h3>
            {cartItems.map(item => (
                <div key={item._id} className="checkout-item">
                    <span className="item-qty">{item.qty}x</span>
                    <span className="item-name">{item.name}</span>
                    {/* === DÜZELTME 2: item.price -> item.salePrice olarak değiştirildi === */}
                    <span className="item-price">{(item.qty * (item.salePrice || 0)).toFixed(2)} ₺</span>
                </div>
            ))}
         </div>
        </div>
        <div className="checkout-sidebar">
          <div className="order-total-box">
              <div className="terms-agreement-box">
                <input 
                    id="terms-checkbox" type="checkbox" 
                    checked={isTermsAgreed} onChange={(e) => setIsTermsAgreed(e.target.checked)} 
                />
                <label htmlFor="terms-checkbox" className="terms-label">
                    <span onClick={() => setIsPreInfoModalOpen(true)} className="legal-link">Ön bilgilendirme formu</span>'nu ve <span onClick={() => setIsSalesModalOpen(true)} className="legal-link">Mesafeli satış sözleşmesi</span>'ni okudum ve onaylıyorum.
                </label>
              </div>
              <button className="place-order-btn" onClick={placeOrderHandler} disabled={loading || !isTermsAgreed}>
                  {loading ? 'Onaylanıyor...' : 'Siparişi Onayla'}
              </button>
              <h3>Ödenecek Tutar</h3>
              <div className="total-row">
                  <span>Ürünler</span>
                  {/* === DÜZELTME 3: itemsPrice artık doğru hesaplandığı için burası çalışacak === */}
                  <span>{itemsPrice.toFixed(2)} ₺</span>
              </div>
              <div className="total-row">
                  <span>Kargo</span>
                  <span>{shippingPrice === 0 ? 'Ücretsiz' : `${shippingPrice.toFixed(2)} ₺`}</span>
              </div>
              <div className="total-row total">
                  <span>Toplam</span>
                  <span>{totalPrice.toFixed(2)} ₺</span>
              </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default CheckoutPage;