import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import Paginate from '../components/Paginate';
import SkeletonCard from '../components/ui/SkeletonCard'; // Yeni import
import EmptyState from '../components/ui/EmptyState'; // Yeni import
import './ProductsPage.css';

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { keyword: urlKeyword, pageNumber, categoryId } = useParams();
  const currentPage = pageNumber || 1;

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const searchKeyword = urlKeyword || '';
        let url = `/api/products?keyword=${searchKeyword}&pageNumber=${currentPage}`;
        if (categoryId) { url += `&category=${categoryId}`; }

        const response = await fetch(url);
        const data = await response.json();
        if (!response.ok) throw new Error('Ürünler getirilirken bir sorun oluştu.');
        setProducts(data.products);
        setPage(data.page);
        setPages(data.pages);
      } catch (err) { setError(err.message);
      } finally { setLoading(false); }
    };
    fetchProducts();
  }, [currentPage, urlKeyword, categoryId]);

  const renderContent = () => {
    if (loading) {
      // Yüklenirken 8 adet iskelet kart göster
      return Array.from({ length: 8 }, (_, i) => <SkeletonCard key={i} />);
    }
    if (error) {
      return <div className="error-container full-width">Hata: {error}</div>;
    }
    if (products.length === 0) {
      return (
        <div className="full-width">
            <EmptyState 
                message="Bu kritere uygun ürün bulunamadı."
                link="/products"
                linkText="Tüm Ürünleri Gör"
            />
        </div>
      );
    }
    return products.map(product => <ProductCard key={product._id} product={product} />);
  };

  return (
    <div className="products-page">
      <h1>Ürünlerimiz</h1>
      <div className="products-grid">
        {renderContent()}
      </div>
      {!loading && products.length > 0 && (
          <Paginate pages={pages} page={page} keyword={urlKeyword || ''} categoryId={categoryId || ''} />
      )}
    </div>
  );
}

export default ProductsPage;