import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import ProductCard from '../../components/ProductCard';
import Paginate from '../../components/Paginate';
import SkeletonCard from '../../components/ui/SkeletonCard';
import '../salesrep/NewOrderPage.css';

const NewQuotePage = () => {
  const navigate = useNavigate();
  const { authToken, user } = useContext(AuthContext);

  const [customers, setCustomers] = useState([]); // only for sales_rep
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerKeyword, setCustomerKeyword] = useState('');
  const [customersLoading, setCustomersLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState([]);
  const [note, setNote] = useState('');
  const [subtotal, setSubtotal] = useState(0);

  const isSalesRep = user?.role === 'sales_rep';

  // Debounce arama terimi
  useEffect(() => {
    const t = setTimeout(() => setCustomerKeyword(customerSearch.trim()), 500);
    return () => clearTimeout(t);
  }, [customerSearch]);

  // fetch customers if sales_rep
  useEffect(() => {
    if (!isSalesRep || !authToken) return;
    const fetchCustomers = async () => {
      setCustomersLoading(true);
      const res = await fetch(`/api/salesrep/customers?keyword=${customerKeyword}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (res.ok) setCustomers(data);
      setCustomersLoading(false);
    };
    fetchCustomers();
  }, [isSalesRep, authToken, customerKeyword]);

  // fetch products
  useEffect(() => {
    if (!authToken) return;
    const fetchProducts = async () => {
      setLoading(true);
      const productUrl = `/api/products?keyword=${keyword}&pageNumber=${page}`;
      const res = await fetch(productUrl, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
      const data = await res.json();
      if (res.ok) {
        setProducts(data.products);
        setPages(data.pages);
        setPage(data.page);
      } else toast.error('Ürünler alınamadı');
      setLoading(false);
    };
    fetchProducts();
  }, [authToken, keyword, page]);

  useEffect(() => {
    const t = setTimeout(() => {
      setKeyword(searchTerm);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const addItem = (p) => {
    setItems((prev) => {
      const ex = prev.find((it) => it._id === p._id);
      if (ex) return prev.map((it) => (it._id === p._id ? { ...it, qty: it.qty + 1 } : it));
      return [...prev, { ...p, qty: 1 }];
    });
    toast.info(`${p.name} eklendi`);
  };

  const removeItem = (id) => {
    setItems(items.filter((i) => i._id !== id));
  };

  const updateItemQty = (productId, newQty) => {
    if (newQty === '' || /^[1-9]\d*$/.test(newQty)) {
      setItems(prevItems =>
        prevItems.map(item =>
          item._id === productId ? { ...item, qty: newQty === '' ? '' : parseInt(newQty, 10) } : item
        )
      );
    }
  };

  const handleQtyBlur = (productId, currentQty) => {
    if (currentQty === '' || parseInt(currentQty, 10) < 1) {
      setItems(prevItems =>
        prevItems.map(item =>
          item._id === productId ? { ...item, qty: 1 } : item
        )
      );
    }
  };

  useEffect(() => {
    const newSubtotal = items.reduce((acc, item) => {
      const itemQty = item.qty === '' ? 0 : Number(item.qty);
      const price = item.salePrice || item.price || 0;
      return acc + price * itemQty;
    }, 0);
    setSubtotal(newSubtotal);
  }, [items]);

  const handleSubmit = async () => {
    if (isSalesRep && !selectedCustomer) return toast.error('Müşteri seçin');
    if (items.length === 0) return toast.error('Ürün ekleyin');

    const body = {
      customerId: isSalesRep ? selectedCustomer : undefined,
      note,
      items: items.map((it) => ({ productId: it._id, qty: it.qty === '' ? 1 : parseInt(it.qty, 10) })),
    };
    const res = await fetch('/api/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) return toast.error(data.msg || 'Teklif oluşturulamadı');
    toast.success('Teklif isteği gönderildi');
    navigate(-1);
  };

  return (
    <div className="order-creation-page">
      <div className="order-creation-header">
      <h1>Yeni Teklif İste</h1>
    </div>
      {isSalesRep && (
        <div className="customer-select-area">
          <input
            type="text"
            placeholder="Müşteri adı veya email ara..."
            className="search-input"
            style={{ maxWidth: '400px', marginBottom: '1rem' }}
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
          />
          {customersLoading ? (
            <p>Yükleniyor...</p>
          ) : (
            <table className="admin-table" style={{ marginBottom: '1rem' }}>
              <thead>
                <tr>
                  <th>Müşteri</th>
                  <th>Email</th>
                  <th>Seç</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c._id}>
                    <td>{c.companyTitle || c.name}</td>
                    <td>{c.email}</td>
                    <td>
                      <button className="action-btn order-btn" onClick={() => setSelectedCustomer(c._id)}>Seç</button>
                    </td>
                  </tr>
                ))}
                {customers.length === 0 && <tr><td colSpan="3">Kayıt bulunamadı</td></tr>}
              </tbody>
            </table>
          )}
          {selectedCustomer && <p>Seçilen müşteri ID: {selectedCustomer}</p>}
        </div>
      )}

      <div className="order-creation-grid">
        <div className="product-selection-area">
          <div className="search-form">
            <input 
              type="text" 
              placeholder="Ürün adı veya SKU ile ara..." 
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="products-grid">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            ) : (
              products.map((p) => <ProductCard key={p._id} product={p} onAddToCart={addItem} />)
            )}
          </div>
          <Paginate pages={pages} page={page} onPageChange={(p) => setPage(p)} />
        </div>

        <aside className="order-summary-sidebar">
          <h3>Teklif Özeti</h3>
          {items.length === 0 ? (
            <p className="summary-empty-msg">Teklif listesi boş.</p>
          ) : (
            <ul className="summary-item-list">
              {items.map((it) => (
                <li key={it._id} className="summary-item">
                  <span className="summary-item-name">{it.name}</span>
                  <div className="summary-item-qty">
                    <input
                      type="number"
                      value={it.qty}
                      onChange={(e) => updateItemQty(it._id, e.target.value)}
                      onBlur={() => handleQtyBlur(it._id, it.qty)}
                      className="qty-input"
                      min="1"
                    />
                  </div>
                  <button onClick={() => removeItem(it._id)} className="remove-item-btn">&times;</button>
                </li>
              ))}
            </ul>
          )}
          
          <div className="quote-note-container">
            <label htmlFor="quoteNote">Not Ekle (Opsiyonel)</label>
            <textarea
              id="quoteNote"
              placeholder="Teklifinizle ilgili özel notlarınızı buraya yazabilirsiniz..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
            />
          </div>

          <div className="summary-total">
            <span>Tahmini Toplam Fiyat:</span>
            <span>{subtotal.toFixed(2)} ₺</span>
          </div>
          <button className="place-order-btn quote-btn" onClick={handleSubmit} disabled={items.length === 0}>
            Teklif İsteği Gönder
          </button>
        </aside>
      </div>
    </div>
  );
};

export default NewQuotePage;
