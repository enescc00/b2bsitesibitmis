import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import EmptyState from '../components/ui/EmptyState'; // Yeni import
import './CartPage.css';
import { assetUrl } from '../config/api';

function CartPage() {
  const { cartItems, removeFromCart } = useContext(CartContext);
  const navigate = useNavigate();

  const handleRemove = (id) => { removeFromCart(id); };
  const handleCheckout = () => { navigate('/checkout'); };

  const subtotal = cartItems.reduce((acc, item) => acc + item.qty * (item.salePrice || 0), 0);

  return (
    <div className="cart-page">
      <h1>Alışveriş Sepeti</h1>
      {cartItems.length === 0 ? (
        <EmptyState 
            message="Sepetiniz şu anda boş."
            link="/products"
            linkText="Alışverişe Başlayın"
        />
      ) : (
        <div className="cart-container">
          <div className="cart-items">
              {cartItems.map(item => (
                <div key={item._id} className="cart-item">
                    <div className="cart-item-image">
                        <img src={item.images && item.images.length > 0 ? assetUrl(item.images[0]) : 'https://placehold.co/80x80?text=No+Image'} alt={item.name} />
                    </div>
                    <div className="cart-item-details">
                        <div className="cart-item-name">{item.name}</div>
                        <div className="cart-item-price">{(item.salePrice || 0).toFixed(2)} ₺</div>
                    </div>
                    <div className="cart-item-qty">Miktar: {item.qty}</div>
                    <div className="cart-item-remove"><button onClick={() => handleRemove(item._id)}>Kaldır</button></div>
                </div>
              ))}
          </div>
          <div className="cart-summary">
            <h2>Sepet Özeti</h2>
            <p>Ara Toplam: {subtotal.toFixed(2)} ₺</p>
            <button className="checkout-btn" onClick={handleCheckout}>Siparişi Tamamla</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CartPage;