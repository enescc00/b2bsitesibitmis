import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import ProductCard from '../../components/ProductCard';
import Paginate from '../../components/Paginate';
import SkeletonCard from '../../components/ui/SkeletonCard';
import './NewOrderPage.css';

function NewOrderPage() {
  const { customerId } = useParams();

  // Yeni: müşteri seçimi için listeler
  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerKeyword, setCustomerKeyword] = useState('');
  const [customersLoading, setCustomersLoading] = useState(false);
  const navigate = useNavigate();
  const { authToken } = useContext(AuthContext);

  const [customer, setCustomer] = useState(null);
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  
  const [orderItems, setOrderItems] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Tüm ürünleri ve müşteri bilgisini getiren fonksiyon
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!authToken || !customerId) return;
      setLoading(true);
      try {
        const [productsRes, customerRes] = await Promise.all([
          fetch(`/api/products/all?keyword=${keyword}&pageNumber=${page}`, { headers: { 'Authorization': `Bearer ${authToken}` } }),
          fetch(`/api/salesrep/customers/${customerId}`, { headers: { 'Authorization': `Bearer ${authToken}` } })
        ]);

        const productsData = await productsRes.json();
        const customerData = await customerRes.json();

        if (!productsRes.ok) throw new Error('Ürünler getirilemedi.');
        if (!customerRes.ok) throw new Error('Müşteri bilgisi alınamadı.');

        setProducts(productsData.products);
        setPage(productsData.page);
        setPages(productsData.pages);
        setCustomer(customerData);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [authToken, customerId, keyword, page]);
  
  // Debounce müşteri araması
  useEffect(() => {
    const t = setTimeout(() => {
      setCustomerKeyword(customerSearch.trim());
    }, 500);
    return () => clearTimeout(t);
  }, [customerSearch]);

  // customerId yokken müşterileri getir
  useEffect(() => {
    const fetchCustomers = async () => {
      if (customerId || !authToken) return;
      setCustomersLoading(true);
      try {
        const res = await fetch(`/api/salesrep/customers?keyword=${customerKeyword}`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.msg || 'Müşteriler getirilemedi.');
        setCustomers(data);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setCustomersLoading(false);
      }
    };
    fetchCustomers();
  }, [authToken, customerId, customerKeyword]);

  // Arama için debounce (gecikme) efekti
  useEffect(() => {
    const timer = setTimeout(() => {
        setKeyword(searchTerm);
        setPage(1); // Arama yapıldığında her zaman ilk sayfaya dön
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Yerel sepet fonksiyonları
  const addToLocalCart = (productToAdd) => {
    setOrderItems(prevItems => {
        const exist = prevItems.find(item => item._id === productToAdd._id);
        if (exist) {
            return prevItems.map(item =>
                item._id === productToAdd._id ? { ...exist, qty: exist.qty + 1 } : item
            );
        } else {
            return [...prevItems, { ...productToAdd, qty: 1 }];
        }
    });
    toast.info(`${productToAdd.name} siparişe eklendi.`);
  };

  const removeFromLocalCart = (productId) => {
    setOrderItems(prevItems => prevItems.filter(item => item._id !== productId));
  };
  
  const subtotal = orderItems.reduce((acc, item) => acc + item.qty * (item.salePrice || 0), 0);
  
  const handlePlaceOrder = async () => {
      if(orderItems.length === 0) {
          return toast.error("Lütfen önce siparişe ürün ekleyin.");
      }
      
      if (!customer || !customer.addresses || customer.addresses.length === 0) {
          return toast.error("Müşterinin kayıtlı bir teslimat adresi bulunamadı. Lütfen önce admin panelinden müşteriye bir adres ekleyin.");
      }

      try {
          const orderData = {
              customerId: customer._id,
              orderItems: orderItems.map(item => ({
                  name: item.name,
                  qty: item.qty,
                  price: item.salePrice || 0,
                  product: item._id
              })),
              shippingAddress: customer.addresses[0],
              paymentMethod: 'Cari Hesap',
              totalPrice: subtotal,
          };

          const response = await fetch('/api/salesrep/orders', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}`},
              body: JSON.stringify(orderData)
          });
          const createdOrder = await response.json();
          if (!response.ok) throw new Error(createdOrder.msg || 'Sipariş oluşturulamadı.');
          
          toast.success('Sipariş başarıyla oluşturuldu!');
          navigate('/portal/customers');
      } catch(err) {
          toast.error(err.message);
      }
  };


  // Müşteri henüz seçilmediyse, müşteri seçimi arayüzünü göster
  if (!customerId) {
    if (customersLoading) return <div className="loading-container">Müşteriler Yükleniyor...</div>;
    return (
      <div className="order-creation-page">
        <div className="order-creation-header">
          <h1>Yeni Sipariş Oluştur</h1>
          <p>Lütfen sipariş oluşturmak için bir müşteri seçin.</p>
        </div>
        <div className="customer-select-area">
          <input
            type="text"
            placeholder="Müşteri adı veya email ara..."
            className="search-input"
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            style={{ maxWidth: '400px', marginBottom: '1rem' }}
          />
          {customers.length === 0 ? (
            <p>Gösterilecek müşteri yok.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Müşteri</th>
                  <th>Email</th>
                  <th>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c._id}>
                    <td>{c.companyTitle || c.name}</td>
                    <td>{c.email}</td>
                    <td>
                      <button className="action-btn order-btn" onClick={() => navigate(`/portal/new-order/${c._id}`)}>
                        Seç
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }

  if (loading && !customer) return <div className="loading-container">Veriler Yükleniyor...</div>;

  return (
    <div className="order-creation-page">
      <div className="order-creation-header">
        <h1>Yeni Sipariş Oluştur</h1>
        {customer && <p className="customer-name">Müşteri: {customer.companyTitle || customer.name}</p>}
      </div>

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
                products.map(product => (
                    <ProductCard 
                        key={product._id} 
                        product={product} 
                        onAddToCart={addToLocalCart}
                    />
                ))
            )}
          </div>
          {/* === DÜZELTME: Paginate bileşeni artık aktif === */}
          <Paginate pages={pages} page={page} onPageChange={(p) => setPage(p)} />
        </div>

        <aside className="order-summary-sidebar">
          <h3>Sipariş Özeti</h3>
          <ul className="summary-item-list">
            {orderItems.length === 0 ? <p>Sipariş boş.</p> : orderItems.map((item, index) => (
                <li key={`${item._id}-${index}`} className="summary-item">
                    <span className="summary-item-name">{item.name}</span>
                    <span className="summary-item-qty">{item.qty}x</span>
                    <span className="summary-item-price">{(item.salePrice * item.qty).toFixed(2)}₺</span>
                    <button onClick={() => removeFromLocalCart(item._id)} className="remove-item-btn">&times;</button>
                </li>
            ))}
          </ul>
          <div className="summary-total">
            <span>Toplam:</span>
            <span>{subtotal.toFixed(2)} ₺</span>
          </div>
          <button className="place-order-btn" onClick={handlePlaceOrder} disabled={orderItems.length === 0}>
              Siparişi Tamamla
          </button>
        </aside>
      </div>
    </div>
  );
}

export default NewOrderPage;