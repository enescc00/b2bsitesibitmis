import React, { useState, useEffect, useContext, useMemo } from 'react';
import { API_BASE_URL, assetUrl } from '../../config/api';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import './OrderDetailPage.css'; // Stil dosyamızı import ediyoruz

function OrderDetailPage() {
  const { id: orderId } = useParams();
  const navigate = useNavigate();
  const { authToken } = useContext(AuthContext);

  const [order, setOrder] = useState(null); // Düzenlenebilir sipariş verisini tutan state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Sipariş detaylarını getiren fonksiyon
  const enrichItemsWithImages = async (orderData) => {
    try {
      const allItems = [...orderData.orderItems, ...(orderData.backorderedItems || [])];
      const productsToFetch = allItems.filter(i => !(i.image || (i.images && i.images.length))).map(i => i.product);
      const uniqueIds = [...new Set(productsToFetch)];
      if(uniqueIds.length === 0) return;
      const responses = await Promise.all(uniqueIds.map(id => fetch(`/api/products/${id}`)));
      const products = await Promise.all(responses.map(r => r.json()));
      const imageMap = {};
      products.forEach(p=>{ imageMap[p._id] = p.images && p.images.length ? p.images[0] : p.image; });
      setOrder(prev=> ({
        ...prev,
        orderItems: prev.orderItems.map(it=> imageMap[it.product] ? {...it, image: imageMap[it.product]} : it),
        backorderedItems: prev.backorderedItems?.map(it=> imageMap[it.product] ? {...it, image: imageMap[it.product]} : it)
      }));
    } catch(err){ console.error('Resimler alınamadı', err); }
  };

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders/${orderId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.msg || 'Sipariş detayları getirilemedi.');
      setOrder(data);
          // Eksik resimleri getir
          enrichItemsWithImages(data);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authToken && orderId) {
      fetchOrderDetails();
    }
  }, [authToken, orderId]);

  // Sipariş kalemlerinin adedini değiştiren fonksiyon
  const handleQuantityChange = (productId, newQty) => {
    const quantity = parseInt(newQty, 10);
    if (isNaN(quantity) || quantity < 0) return;

    setOrder(prevOrder => ({
      ...prevOrder,
      orderItems: prevOrder.orderItems.map(item => 
        item.product === productId ? { ...item, qty: quantity } : item
      )
    }));
  };

  // Bir kalemi siparişten tamamen silen fonksiyon
  const handleDeleteItem = (itemToDelete) => {
      if(window.confirm(`"${itemToDelete.name}" ürününü siparişten tamamen kaldırmak istediğinizden emin misiniz? Bu işlem geri alınamaz.`)){
        setOrder(prevOrder => ({
            ...prevOrder,
            orderItems: prevOrder.orderItems.filter(item => item.product !== itemToDelete.product)
        }));
      }
  };

  // Bir kalemi "Eksik Ürünler" listesine taşıyan fonksiyon
  const handleBackorderItem = (itemToBackorder) => {
    setOrder(prevOrder => ({
        ...prevOrder,
        orderItems: prevOrder.orderItems.filter(item => item.product !== itemToBackorder.product),
        backorderedItems: [...(prevOrder.backorderedItems || []), itemToBackorder]
    }));
  };

  // Eksik bir ürünü tekrar sipariş kalemlerine ekleyen fonksiyon
  const handleFulfillBackorder = (itemToFulfill) => {
    setOrder(prevOrder => ({
        ...prevOrder,
        backorderedItems: prevOrder.backorderedItems.filter(item => item.product !== itemToFulfill.product),
        orderItems: [...prevOrder.orderItems, itemToFulfill]
    }));
  };

  // Yazdır işlevi
  const handlePrint = async () => {
    try {
      if (order.status === 'Beklemede') {
        const res = await fetch(`/api/orders/${orderId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
          body: JSON.stringify({ status: 'Hazırlanıyor' })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.msg || 'Durum güncellenemedi');
        setOrder(data);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      window.print();
    }
  };

  // Toplam tutarı anlık olarak hesaplayan useMemo
  const currentTotal = useMemo(() => {
    if (!order) return 0;
    return order.orderItems.reduce((acc, item) => acc + item.price * item.qty, 0);
  }, [order]);
  
  // Değişiklikleri backend'e kaydeden fonksiyon
  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
        const payload = {
            orderItems: order.orderItems,
            backorderedItems: order.backorderedItems
        };
        const response = await fetch(`/api/orders/${orderId}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}`},
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if(!response.ok) throw new Error(data.msg || 'Sipariş güncellenemedi.');

        toast.success('Sipariş başarıyla güncellendi!');
        fetchOrderDetails(); // Sayfayı en güncel haliyle yeniden çek
    } catch (err) {
        toast.error(err.message);
    } finally {
        setIsSaving(false);
    }
  };


        if (loading) return <div className="loading-container">Sipariş Detayları Yükleniyor...</div>;
  if (error) return <div className="error-container">Hata: {error}</div>;
  if (!order) return <div>Sipariş bulunamadı.</div>;

  return (
    <div className="admin-page-container">
      <button onClick={() => navigate('/admin/orders')} className="back-btn">&larr; Tüm Siparişlere Dön</button>

      <div className="page-header">
                <h1>Sipariş Düzenle (#{String(order.orderNumber).padStart(4, '0')})</h1>
        <button onClick={handlePrint} className="print-btn">Yazdır</button>
      </div>

      <div className="print-header">
        <div className="print-header-left">
          <img src="/logo-print.png" alt="Curkuslar C.M.S Logo" className="print-logo" />
        </div>
        <div className="print-header-right">
                    <p><strong>Sipariş No:</strong> #{String(order.orderNumber).padStart(4, '0')}</p>
          <p><strong>Tarih:</strong> {new Date(order.createdAt).toLocaleString('tr-TR')}</p>
        </div>
      </div>
      <div className="order-detail-grid">
        <div className="order-detail-main">
          <div className="detail-card">
            <h3>Sipariş İçeriği</h3>
            <table className="order-items-table">
                <thead><tr><th>Ürün</th><th>Birim Fiyat</th><th>Adet</th><th>Toplam</th><th className="no-print">İşlemler</th><th className="print-only">Kontrol</th></tr></thead>
                <tbody>
                    {order.orderItems.map(item => (
                        <tr key={item.product}>
                            <td className="item-info"><img src={item.image ? assetUrl(item.image) : (item.images && item.images.length > 0 ? assetUrl(item.images[0]) : 'https://via.placeholder.com/60x60?text=No+Image')} alt={item.name} className="order-item-img" /> <span>{item.name}</span></td>
                            <td>{item.price.toFixed(2)} ₺</td>
                            <td>
                                <input 
                                    type="number" 
                                    value={item.qty} 
                                    onChange={(e) => handleQuantityChange(item.product, e.target.value)}
                                    className="item-qty-input no-print"
                                />
                                <span className="print-only-inline">{item.qty}</span>
                            </td>
                            <td>{(item.price * item.qty).toFixed(2)} ₺</td>
                            <td className="no-print">
                                <button title="Daha Sonra Gönder" className="action-btn backorder" onClick={() => handleBackorderItem(item)}><i className="fas fa-history"></i></button>
                                <button title="Siparişten Sil" className="action-btn delete" onClick={() => handleDeleteItem(item)}><i className="fas fa-trash"></i></button>
                            </td>
                            <td className="print-only"><span className="checkbox-box"></span></td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
          
          {order.backorderedItems && order.backorderedItems.length > 0 && (
            <div className="detail-card">
                <h3>Eksik Ürünler (Daha Sonra Gönderilecek)</h3>
                <table className="order-items-table">
                    <thead><tr><th>Ürün</th><th>Adet</th><th className="no-print">İşlem</th><th className="print-only">Kontrol</th></tr></thead>
                    <tbody>
                        {order.backorderedItems.map(item => (
                            <tr key={item.product}>
                                <td className="item-info"><img src={item.image ? assetUrl(item.image) : (item.images && item.images.length > 0 ? assetUrl(item.images[0]) : 'https://via.placeholder.com/60x60?text=No+Image')} alt={item.name} className="order-item-img" /> <span>{item.name}</span></td>
                                <td>{item.qty}</td>
                                <td className="no-print">
                                    <button title="Siparişe Geri Ekle" className="action-btn" onClick={() => handleFulfillBackorder(item)}><i className="fas fa-undo"></i></button>
                                </td>
                                <td className="print-only"><span className="checkbox-box"></span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          )}
        </div>
        <div className="order-detail-sidebar">
          <div className="detail-card no-print">
            <h3>Sipariş Özeti</h3>
            <div className="summary-row"><span>Orijinal Tutar:</span><strong>{order.originalTotalPrice.toFixed(2)} ₺</strong></div>
            <div className="summary-row"><span>Ödeme Yöntemi:</span><strong>{order.paymentMethod}</strong></div>
            <div className="summary-row total">
              <span>GÜNCEL TOPLAM:</span>
              <strong>{currentTotal.toFixed(2)} ₺</strong>
            </div>
            <button className="save-changes-btn" onClick={handleSaveChanges} disabled={isSaving}>
                {isSaving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            </button>
          </div>
          <div className="detail-card">
             <h3>Müşteri Bilgileri</h3>
             <p><strong>İsim:</strong> {order.user.name}</p>
             <p><strong>Email:</strong> {order.user.email}</p>
             {order.shippingAddress && (
                <div className="shipping-address">
                    <p><strong>Teslimat Adresi:</strong></p>
                    <p>{order.shippingAddress.fullAddress}, {order.shippingAddress.district}, {order.shippingAddress.province}</p>
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderDetailPage;