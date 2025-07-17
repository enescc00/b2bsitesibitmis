import React, { useState, useEffect } from 'react';

import apiRequest from '../../utils/apiHelper';
import { toast } from 'react-toastify';

const CreateReturnForCustomerPage = () => {
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [productsToReturn, setProductsToReturn] = useState([]);
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Pazarlamacının müşterilerini getir
        const fetchCustomers = async () => {
            try {
                const data = await apiRequest('/users/my-customers').then(r=>r.json()); // Bu endpoint'in var olduğunu varsayıyoruz
                setCustomers(data);
            } catch (error) {
                toast.error('Müşteriler getirilirken bir hata oluştu.');
            }
        };
        fetchCustomers();
    }, []);

    const handleCustomerSelect = async (customerId) => {
        if (!customerId) {
            setSelectedCustomer(null);
            setOrders([]);
            return;
        }
        const customer = customers.find(c => c._id === customerId);
        setSelectedCustomer(customer);
        try {
            // Seçilen müşterinin tamamlanmış siparişlerini getir
            const data = await apiRequest(`/orders/user/${customerId}?status=Tamamlandı`).then(r=>r.json());
            setOrders(data);
        } catch (error) {
            toast.error('Müşterinin siparişleri getirilirken bir hata oluştu.');
        }
    };

    const handleOrderSelect = (orderId) => {
        try {
            const order = orders.find(o => o._id === orderId);
            setSelectedOrder(order);
            
            if (!order || !order.orderItems || !Array.isArray(order.orderItems)) {
                toast.error('Sipariş detayı yüklenemedi veya sipariş öğeleri bulunamadı.');
                console.error('Order items missing:', order);
                return;
            }
            
            setProductsToReturn(order.orderItems.map(item => ({ ...item, returnQuantity: 0, checked: false })));
        } catch (error) {
            console.error('Order selection error:', error);
            toast.error('Sipariş seçilirken bir hata oluştu.');
        }
    };

    const handleProductCheck = (productId) => {
        setProductsToReturn(productsToReturn.map(p => 
            p.product._id === productId ? { ...p, checked: !p.checked, returnQuantity: !p.checked ? 1 : 0 } : p
        ));
    };

    const handleQuantityChange = (productId, quantity) => {
        const product = productsToReturn.find(p => p.product._id === productId);
        if (quantity > product.quantity || quantity < 0) {
            toast.warn(`En fazla ${product.quantity} adet iade edebilirsiniz.`);
            return;
        }
        setProductsToReturn(productsToReturn.map(p => 
            p.product._id === productId ? { ...p, returnQuantity: Number(quantity) } : p
        ));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const itemsToSubmit = productsToReturn
            .filter(p => p.checked && p.returnQuantity > 0)
            .map(p => ({ product: p.product._id, quantity: p.returnQuantity }));

        if (itemsToSubmit.length === 0) {
            toast.error('Lütfen iade edilecek en az bir ürün seçin.');
            return;
        }
        if (!description.trim()) {
            toast.error('Lütfen iade nedenini açıklayınız.');
            return;
        }

        setLoading(true);
        try {
            await apiRequest('/returns', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({
                orderId: selectedOrder._id,
                products: itemsToSubmit,
                description
            }) });
            toast.success('İade talebi başarıyla oluşturuldu.');
            // Formu sıfırla
            setSelectedOrder(null);
            setDescription('');
            setProductsToReturn([]);
            setOrders([]);
            setSelectedCustomer(null);
        } catch (error) {
            console.error('Return creation error:', error);
            toast.error(error.response?.data?.msg || error.message || 'İade talebi oluşturulurken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Müşteri Adına İade Talebi Oluştur</h1>
            
            {/* Adım 1: Müşteri Seçimi */}
            <div className='mb-4'>
                <label htmlFor="customer-select" className="block text-lg font-semibold mb-2">1. Adım: Müşteri Seçin</label>
                <select id="customer-select" onChange={(e) => handleCustomerSelect(e.target.value)} className="w-full p-2 border rounded-md">
                    <option value="">-- Müşteri Seçiniz --</option>
                    {customers.map(c => <option key={c._id} value={c._id}>{c.name} ({c.companyName})</option>)}
                </select>
            </div>

            {/* Adım 2: Sipariş Seçimi */}
            {selectedCustomer && (
                <div className='mb-4'>
                    <h2 className="text-xl font-semibold mb-2">2. Adım: İade Edilecek Siparişi Seçin</h2>
                    <div className="space-y-2">
                        {orders.length > 0 ? orders.map(order => (
                            <div key={order._id} className={`p-4 border rounded-md hover:bg-gray-100 cursor-pointer ${selectedOrder?._id === order._id ? 'bg-blue-100' : ''}`} onClick={() => handleOrderSelect(order._id)}>
                                <p><strong>Sipariş No:</strong> {order.orderNumber}</p>
                                <p><strong>Tarih:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
                            </div>
                        )) : <p>Seçili müşterinin iade edilebilecek tamamlanmış bir siparişi bulunmuyor.</p>}
                    </div>
                </div>
            )}

            {/* Adım 3 & 4: Ürünler ve Açıklama */}
            {selectedOrder && (
                <form onSubmit={handleSubmit}>
                    <h2 className="text-xl font-semibold mb-2">3. Adım: İade Edilecek Ürünleri ve Miktarı Belirtin</h2>
                    {/* ... Ürün seçme mantığı ... */}
                    <div className="space-y-3 mb-4">
                        {productsToReturn.map(item => (
                            <div key={item.product._id} className="flex items-center p-3 border rounded-md">
                                <input type="checkbox" checked={item.checked} onChange={() => handleProductCheck(item.product._id)} className="mr-4 h-5 w-5"/>
                                <img 
    src={item.product && item.product.images && item.product.images.length > 0 ? item.product.images[0] : '/placeholder-image.jpg'} 
    alt={item.product ? item.product.name : 'Ürün'} 
    className="w-16 h-16 object-cover mr-4"
    onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder-image.jpg'; }}
/>
                                <div className="flex-grow">
                                    <p className="font-semibold">{item.product.name}</p>
                                    <p className="text-sm text-gray-600">Sipariş Edilen Miktar: {item.quantity}</p>
                                </div>
                                {item.checked && (
                                    <input type="number" value={item.returnQuantity} onChange={(e) => handleQuantityChange(item.product._id, e.target.value)} className="w-20 p-1 border rounded-md" min="1" max={item.quantity}/>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="mb-4">
                        <label htmlFor="description" className="block text-lg font-semibold mb-2">4. Adım: İade Nedenini Açıklayın (Zorunlu)</label>
                        <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2 border rounded-md" rows="4" placeholder="Lütfen ürünleri neden iade ettiğinizi detaylı bir şekilde açıklayınız..."/>
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-red-600 text-white py-2 rounded-md hover:bg-red-700 disabled:bg-gray-400">
                        {loading ? 'Gönderiliyor...' : 'İade Talebini Gönder'}
                    </button>
                </form>
            )}
        </div>
    );
};

export default CreateReturnForCustomerPage;
