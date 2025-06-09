import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import './CartPage.css';

function CartPage() {
  const { cartItems, removeFromCart } = useContext(CartContext);
  const navigate = useNavigate();

  const handleRemove = (id) => {
    removeFromCart(id);
  };
  
  const handleCheckout = () => {
    // Artık tüm kontrolleri ve işlemleri CheckoutPage yapacağı için
    // bu buton sadece o sayfaya yönlendirir.
    navigate('/checkout'); 
  };

  const subtotal = cartItems.reduce((acc, item) => acc + item.qty * item.price, 0);

  return (
    <div className="cart-page">
      <h1>Alışveriş Sepeti</h1>
      <div className="cart-container">
        <div className="cart-items">
          {cartItems.length === 0 ? (
            <p>Sepetiniz boş. <Link to="/products">Alışverişe Başla</Link></p>
          ) : (
            cartItems.map(item => (
              <div key={item._id} className="cart-item">
                <div className="cart-item-name">
                  {/* Ürün detay sayfası ileride eklenebilir. */}
                  {item.name}
                </div>
                <div className="cart-item-price">{item.price.toFixed(2)} ₺</div>
                <div className="cart-item-qty">
                  Miktar: {item.qty}
                </div>
                <div className="cart-item-remove">
                  <button onClick={() => handleRemove(item._id)}>Kaldır</button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="cart-summary">
          <h2>Sepet Özeti</h2>
          <p>Ara Toplam: {subtotal.toFixed(2)} ₺</p>
          <button 
            className="checkout-btn" 
            disabled={cartItems.length === 0}
            onClick={handleCheckout}
          >
            Siparişi Tamamla
          </button>
        </div>
      </div>
    </div>
  );
}

export default CartPage;