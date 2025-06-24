import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import './SidebarCart.css';
import { assetUrl } from '../config/api';

function SidebarCart() {
    const { cartItems, removeFromCart, isCartOpen, closeCart } = useContext(CartContext);

    const subtotal = cartItems.reduce((acc, item) => acc + item.qty * (item.salePrice || 0), 0);

    // === DEĞİŞİKLİK: className artık doğrudan ana konteynere uygulanıyor ===
    // ve overlay div'i kaldırıldı.
    return (
        <div className={`sidebar-cart-container ${isCartOpen ? 'open' : ''}`}>
            <div className="sidebar-cart-header">
                <h3>Alışveriş Sepeti</h3>
                <button onClick={closeCart} className="close-btn">&times;</button>
            </div>
            <div className="sidebar-cart-body">
                {cartItems.length === 0 ? (
                    <p className="empty-cart-message">Sepetinizde ürün bulunmamaktadır.</p>
                ) : (
                    cartItems.map(item => (
                        <div key={item._id} className="sidebar-cart-item">
                            <img 
                                src={item.images && item.images.length > 0 ? assetUrl(item.images[0]) : 'https://via.placeholder.com/60x60?text=No+Image'} 
                                alt={item.name} 
                            />
                            <div className="item-details">
                                <span className="item-name">{item.name}</span>
                                <span className="item-price">{item.qty} x {(item.salePrice || 0).toFixed(2)} ₺</span>
                            </div>
                            <button onClick={() => removeFromCart(item._id)} className="remove-item-btn">&times;</button>
                        </div>
                    ))
                )}
            </div>
            <div className="sidebar-cart-footer">
                <div className="subtotal">
                    <span>Ara Toplam:</span>
                    <span>{subtotal.toFixed(2)} ₺</span>
                </div>
                <Link to="/cart" onClick={closeCart} className="go-to-cart-btn">SEPETE GİT</Link>
            </div>
        </div>
    );
}

export default SidebarCart;