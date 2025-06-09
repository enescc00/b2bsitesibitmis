import React, { useContext } from 'react';
import { CartContext } from '../context/CartContext';
import './ProductCard.css';

function ProductCard({ product }) {
  const { addToCart } = useContext(CartContext);

  const categoryName = product.category ? product.category.name : 'Belirtilmemiş';

  return (
    <div className="product-card">
      <h3>{product.name}</h3>
      <p className="product-category">{categoryName}</p>
      <p className="product-price">{product.price.toFixed(2)} ₺</p>
      <p className="product-stock">Stok: {product.stock}</p>
      <button className="add-to-cart-btn" onClick={() => addToCart(product)}>
        Sepete Ekle
      </button>
    </div>
  );
}

export default ProductCard;