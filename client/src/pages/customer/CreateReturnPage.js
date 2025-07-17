import React, { useState, useEffect } from 'react';
import apiRequest from '../../utils/apiHelper';
import { toast } from 'react-toastify';

const CreateReturnPage = () => {
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [productsToReturn, setProductsToReturn] = useState([]);
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                // Sadece tamamlanmış siparişleri getir
                const data = await apiRequest('/orders/myorders?status=Tamamlandı').then(r=>r.json());
                setOrders(data);
            } catch (error) {
                toast.error('Siparişleriniz getirilirken bir hata oluştu.');
            }
        };
        fetchOrders();
    }, []);

    const handleOrderSelect = (orderId) => {
        try {
            const order = orders.find(o => o._id === orderId);
            setSelectedOrder(order);
            // İade edilecek ürünleri başlangıç durumuyla ayarla
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
            await apiRequest('/returns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: selectedOrder._id,
                    products: itemsToSubmit,
                    description
                })
            });
            toast.success('İade talebiniz başarıyla oluşturuldu.');
            // Formu sıfırla
            setSelectedOrder(null);
            setDescription('');
            setProductsToReturn([]);
        } catch (error) {
            console.error('Return creation error:', error);
            toast.error(error.response?.data?.msg || error.message || 'İade talebi oluşturulurken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">İade Talebi Oluştur</h1>
            
            {!selectedOrder ? (
                <div>
                    <h2 className="text-xl font-semibold mb-2">1. Adım: İade Edilecek Siparişi Seçin</h2>
                    <div className="space-y-2">
                        {orders.length > 0 ? orders.map(order => (
                            <div key={order._id} className="p-4 border rounded-md hover:bg-gray-100 cursor-pointer" onClick={() => handleOrderSelect(order._id)}>
                                <p><strong>Sipariş No:</strong> {order.orderNumber}</p>
                                <p><strong>Tarih:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
                                <p><strong>Tutar:</strong> {order.totalPrice.toFixed(2)} TL</p>
                            </div>
                        )) : <p>İade edilebilecek tamamlanmış bir siparişiniz bulunmuyor.</p>}
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit}>
                    <button type="button" onClick={() => setSelectedOrder(null)} className="mb-4 text-blue-600 hover:underline">← Farklı bir sipariş seç</button>
                    <h2 className="text-xl font-semibold mb-2">2. Adım: İade Edilecek Ürünleri ve Miktarı Belirtin</h2>
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
                                    <input 
                                        type="number" 
                                        value={item.returnQuantity}
                                        onChange={(e) => handleQuantityChange(item.product._id, e.target.value)}
                                        className="w-20 p-1 border rounded-md"
                                        min="1"
                                        max={item.quantity}
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="mb-4">
                        <label htmlFor="description" className="block text-lg font-semibold mb-2">3. Adım: İade Nedenini Açıklayın (Zorunlu)</label>
                        <textarea 
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full p-2 border rounded-md"
                            rows="4"
                            placeholder="Lütfen ürünleri neden iade ettiğinizi detaylı bir şekilde açıklayınız..."
                        />
                    </div>

                    <button type="submit" disabled={loading} className="w-full bg-red-600 text-white py-2 rounded-md hover:bg-red-700 disabled:bg-gray-400">
                        {loading ? 'Gönderiliyor...' : 'İade Talebini Gönder'}
                    </button>
                </form>
            )}
        </div>
    );
};

export default CreateReturnPage;
