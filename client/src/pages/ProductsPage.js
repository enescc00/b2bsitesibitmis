import React, { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import './ProductsPage.css';

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/products');
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error('Ürünler getirilirken hata oluştu:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []); // Boş dependency array, bu effect'in sadece bileşen ilk yüklendiğinde çalışmasını sağlar

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div className="products-page">
      <h1>Ürünlerimiz</h1>
      <div className="products-grid">
        {products.length > 0 ? (
          products.map(product => (
            <ProductCard key={product._id} product={product} />
          ))
        ) : (
          <p>Gösterilecek ürün bulunamadı.</p>
        )}
      </div>
    </div>
  );
}

export default ProductsPage;