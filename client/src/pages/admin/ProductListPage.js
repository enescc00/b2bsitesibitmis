import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import Paginate from '../../components/Paginate';
import { toast } from 'react-toastify';
import './AdminTable.css';

function ProductListPage() {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [keyword, setKeyword] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const { authToken } = useContext(AuthContext);
  const navigate = useNavigate();
  const { pageNumber } = useParams();
  const currentPage = pageNumber || 1;

  const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/products/all?keyword=${keyword}&pageNumber=${currentPage}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error('Ürünler getirilemedi.');
        setProducts(data.products);
        setPage(data.page);
        setPages(data.pages);
      } catch (err) {
        setError(err.message);
      } finally { setLoading(false); }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
        setKeyword(searchTerm);
        if (searchTerm) navigate('/admin/products/page/1');
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, navigate]);
  
  useEffect(() => {
    if (authToken) { fetchProducts(); }
  }, [currentPage, keyword, authToken]);
  
  const updateProductField = async (id, fieldData) => {
    try {
        const res = await fetch(`/api/products/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
            body: JSON.stringify(fieldData)
        });
        const updatedProduct = await res.json();
        if (!res.ok) throw new Error('Güncelleme başarısız');
        setProducts(products.map(p => p._id === id ? updatedProduct : p));
        toast.info(`"${updatedProduct.name}" güncellendi.`);
    } catch(err) { toast.error(err.message); }
  };
  
  const handleMarginChange = (id, newMargin) => {
    const margin = Number(newMargin);
    if (!isNaN(margin)) { updateProductField(id, { profitMargin: margin }); }
  };

  const handleStatusToggle = (id, currentStatus) => {
    updateProductField(id, { isActive: !currentStatus });
  };
  
  const handleDelete = async (id) => {
    if (window.confirm('Bu ürünü silmek istediğinizden emin misiniz?')) {
        try {
            await fetch(`/api/products/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${authToken}` } });
            toast.success("Ürün başarıyla silindi.");
            setProducts(products.filter(p => p._id !== id));
        } catch (err) { toast.error(err.message); }
    }
  };

  // === YENİ FONKSİYON ===
  const handleRecalculatePrice = async (id) => {
      try {
        const res = await fetch(`/api/products/${id}/recalculate-price`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${authToken}` },
        });
        const updatedProduct = await res.json();
        if (!res.ok) throw new Error('Fiyat güncellenemedi.');
        // Listeyi anında güncelle
        setProducts(products.map(p => p._id === id ? updatedProduct : p));
        toast.success(`"${updatedProduct.name}" fiyatı güncellendi.`);
      } catch (err) {
        toast.error(err.message);
      }
  };
  
  if (loading) return <div className="loading-container">Yükleniyor...</div>;
  if (error) return <div className="error-container">Hata: {error}</div>;

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <h1>Satış Ürünleri Yönetimi</h1>
        <button onClick={() => navigate('/admin/product/new')} className="add-new-btn">Yeni Ürün Ekle</button>
      </div>
      <div className="search-form">
        <input type="text" placeholder="Ürün adı ara..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input" />
      </div>
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Ürün Adı</th>
              <th>Maliyet</th>
              <th>Kâr Marjı (%)</th>
              <th>Satış Fiyatı</th>
              <th>Durum</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product._id} className={product.profitabilityAlert ? 'row-alert' : ''}>
                <td>{product.name}</td>
                <td>{(product.costPrice || 0).toFixed(2)} ₺</td>
                <td><input type="number" defaultValue={product.profitMargin} onBlur={(e) => handleMarginChange(product._id, e.target.value)} className="inline-input"/></td>
                <td>{(product.salePrice || 0).toFixed(2)} ₺</td>
                <td>
                  {product.profitabilityAlert && (
                    <span className="status-badge alert">Kârlılık Düşük!</span>
                  )}
                  <label className="switch">
                      <input type="checkbox" checked={product.isActive} onChange={() => handleStatusToggle(product._id, product.isActive)} />
                      <span className="slider round"></span>
                  </label>
                </td>
                <td className="action-cell">
                  {/* === YENİ BUTON === */}
                  {product.profitabilityAlert && (
                      <button onClick={() => handleRecalculatePrice(product._id)} className="approve-btn">Fiyatı Güncelle</button>
                  )}
                  <button onClick={() => navigate(`/admin/product/${product._id}`)} className="edit-btn">Düzenle</button>
                  <button onClick={() => handleDelete(product._id)} className="delete-btn">Sil</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Paginate pages={pages} page={page} isAdmin={true} baseUrl='/admin/products' />
    </div>
  );
}
export default ProductListPage;