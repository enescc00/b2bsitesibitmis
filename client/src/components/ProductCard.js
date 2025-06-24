import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { WishlistContext } from '../context/WishlistContext';
import { AuthContext } from '../context/AuthContext';
import './ProductCard.css';
import { assetUrl } from '../config/api';

// === DEĞİŞİKLİK: Bileşen artık opsiyonel olarak "onAddToCart" prop'u alıyor ===
function ProductCard({ product, onAddToCart }) {
  // Global context'i hala kullanıyoruz, eğer onAddToCart prop'u gelmezse diye.
  const globalCart = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const { addToWishlist, removeFromWishlist, isFavorited } = useContext(WishlistContext);

  const isProductFavorited = user ? isFavorited(product._id) : false;

  const handleWishlistToggle = (e) => {
    e.stopPropagation();
    if (!user) {
        return;
    }
    if (isProductFavorited) {
      removeFromWishlist(product._id);
    } else {
      addToWishlist(product._id);
    }
  };

  // Sepete ekleme fonksiyonu. Eğer onAddToCart prop'u varsa onu, yoksa global context'i kullanır.
  const handleAddToCartClick = () => {
    if (onAddToCart) {
        onAddToCart(product);
    } else {
        globalCart.addToCart(product);
    }
  };

  return (
    <div className="product-card">
        <Link to={`/product/${product._id}`} className="product-link">
            {user && (
                <button onClick={handleWishlistToggle} className="wishlist-btn">
                    <i className={`${isProductFavorited ? 'fas' : 'far'} fa-heart`}></i>
                </button>
            )}
            <div className="product-image-container">
                <img className="product-card-image" src={product.images && product.images.length > 0 ? assetUrl(product.images[0]) : 'https://via.placeholder.com/300?text=Görsel+Yok'} alt={product.name}/>
            </div>
            <div className="product-info">
                <p className="product-category">{product.category ? product.category.name : 'Kategorisiz'}</p>
                <h3 className="product-name">{product.name}</h3>
                <p className="product-price">{(product.salePrice || 0).toFixed(2)} ₺</p>
            </div>
        </Link>
        {/* === DEĞİŞİKLİK: handleAddToCartClick fonksiyonu çağrılıyor === */}
        <button className="add-to-cart-btn" onClick={handleAddToCartClick}>Sepete Ekle</button>
    </div>
  );
}

export default ProductCard;