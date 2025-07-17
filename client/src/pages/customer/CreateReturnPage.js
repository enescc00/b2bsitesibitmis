import React, { useState, useEffect } from 'react';
import apiRequest from '../../utils/apiHelper';
import { toast } from 'react-toastify';
import { FaBox, FaHistory, FaArrowLeft, FaSearch, FaSpinner } from 'react-icons/fa';

const CreateReturnPage = () => {
    // Ana durum değişkenleri
    const [activeTab, setActiveTab] = useState('new'); // 'new' veya 'history'
    const [purchasedProducts, setPurchasedProducts] = useState([]); // Tüm satın alınmış ürünler
    const [selectedProducts, setSelectedProducts] = useState({}); // İade edilecek ürünler {id: {quantity, orderId}}
    const [description, setDescription] = useState(''); // İade açıklaması
    const [loading, setLoading] = useState(false);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [returnHistory, setReturnHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(true);

    useEffect(() => {
        fetchAllPurchasedProducts();
        fetchReturnHistory();
    }, []);
    
    // Tüm tamamlanmış siparişlerdeki ürünleri getir
    const fetchAllPurchasedProducts = async () => {
        setLoadingProducts(true);
        try {
            const data = await apiRequest('/orders/myorders?status=Tamamlandı').then(r => r.json());
            
            // Tüm siparişlerden ürünleri çıkar ve düzleştir
            const allProducts = [];
            data.forEach(order => {
                if (order.orderItems && Array.isArray(order.orderItems)) {
                    order.orderItems.forEach(item => {
                        // Her ürüne sipariş bilgisini ekle
                        allProducts.push({
                            ...item,
                            orderDate: new Date(order.createdAt),
                            orderNumber: order.orderNumber,
                            orderId: order._id
                        });
                    });
                }
            });
            
            // Tarih olarak en yeni satın alımlar üstte olacak şekilde sırala
            allProducts.sort((a, b) => b.orderDate - a.orderDate);
            
            setPurchasedProducts(allProducts);
        } catch (error) {
            console.error('Products fetch error:', error);
            toast.error('Satın alınan ürünler yüklenirken bir hata oluştu.');
        } finally {
            setLoadingProducts(false);
        }
    };

    // İade geçmişini getir
    const fetchReturnHistory = async () => {
        setLoadingHistory(true);
        try {
            const data = await apiRequest('/returns/myreturns').then(r => r.json());
            setReturnHistory(data);
        } catch (error) {
            console.error('Return history fetch error:', error);
            toast.error('İade geçmişi yüklenirken bir hata oluştu.');
        } finally {
            setLoadingHistory(false);
        }
    };

    // Ürün seçme/miktarını değiştirme işlemi
    const handleProductSelect = (product, isChecked, quantity = 1) => {
        if (isChecked) {
            // Miktar kontrolü
            if (quantity > product.quantity || quantity < 1) {
                toast.warning(`En fazla ${product.quantity} adet iade edebilirsiniz.`);
                quantity = Math.min(Math.max(1, quantity), product.quantity);
            }
            
            setSelectedProducts(prev => ({
                ...prev,
                [product.product._id]: {
                    quantity: parseInt(quantity),
                    orderId: product.orderId,
                    productDetails: product
                }
            }));
        } else {
            // Seçimi kaldır
            setSelectedProducts(prev => {
                const updated = { ...prev };
                delete updated[product.product._id];
                return updated;
            });
        }
    };

    // İade miktarı değişimi
    const handleQuantityChange = (product, quantity) => {
        const parsedQty = parseInt(quantity);
        if (parsedQty > product.quantity) {
            toast.warning(`En fazla ${product.quantity} adet iade edebilirsiniz.`);
            return;
        }
        
        if (parsedQty < 1) {
            toast.warning('En az 1 adet iade etmelisiniz.');
            return;
        }
        
        setSelectedProducts(prev => ({
            ...prev,
            [product.product._id]: {
                ...prev[product.product._id],
                quantity: parsedQty
            }
        }));
    };

    // Gruplandırılmış ürünleri siparişlere göre ayırıp birden fazla iade talebi oluştur
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (Object.keys(selectedProducts).length === 0) {
            toast.error('Lütfen iade edilecek en az bir ürün seçin.');
            return;
        }
        
        if (!description.trim()) {
            toast.error('Lütfen iade nedenini açıklayınız.');
            return;
        }
        
        setLoading(true);
        
        try {
            // Siparişlere göre gruplandır
            const orderGroups = {};
            
            Object.values(selectedProducts).forEach(item => {
                if (!orderGroups[item.orderId]) {
                    orderGroups[item.orderId] = [];
                }
                orderGroups[item.orderId].push({
                    product: item.productDetails.product._id,
                    quantity: item.quantity
                });
            });
            
            // Her sipariş grubu için ayrı talep oluştur
            const promises = Object.entries(orderGroups).map(([orderId, products]) => {
                return apiRequest('/returns', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        orderId,
                        products,
                        description
                    })
                });
            });
            
            await Promise.all(promises);
            
            toast.success('İade talepleriniz başarıyla oluşturuldu.');
            
            // Formu sıfırla
            setSelectedProducts({});
            setDescription('');
            
            // İade geçmişini yeniden yükle
            fetchReturnHistory();
            setActiveTab('history');
            
        } catch (error) {
            console.error('Return creation error:', error);
            toast.error(error.message || 'İade talebi oluşturulurken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    // Bir iadeyi iptal et (sadece "Beklemede" durumunda olan iadeler iptal edilebilir)
    const handleCancelReturn = async (returnId) => {
        try {
            await apiRequest(`/returns/${returnId}/cancel`, {
                method: 'PUT'
            });
            toast.success('İade talebi iptal edildi.');
            fetchReturnHistory(); // İade geçmişini güncelle
        } catch (error) {
            console.error('Cancel return error:', error);
            toast.error(error.message || 'İade iptal edilirken bir hata oluştu.');
        }
    };

    // İade durumu için renk belirle
    const getStatusColor = (status) => {
        switch (status) {
            case 'Beklemede':
                return 'bg-yellow-100 text-yellow-800';
            case 'Onaylandı':
                return 'bg-green-100 text-green-800';
            case 'Reddedildi':
                return 'bg-red-100 text-red-800';
            case 'İşleniyor':
                return 'bg-blue-100 text-blue-800';
            case 'Tamamlandı':
                return 'bg-purple-100 text-purple-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    // İade durumu Türkçe olarak göster
    const getStatusText = (status) => {
        return status || 'Beklemede';
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6 text-center text-blue-800">İade Yönetimi</h1>
            
            {/* Sekme menüsü */}
            <div className="flex border-b border-gray-200 mb-6">
                <button 
                    onClick={() => setActiveTab('new')}
                    className={`py-3 px-6 font-semibold text-lg rounded-t-lg transition-colors ${
                        activeTab === 'new' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    <FaBox className="inline mr-2" /> Yeni İade Talebi Oluştur
                </button>
                <button 
                    onClick={() => setActiveTab('history')}
                    className={`py-3 px-6 font-semibold text-lg rounded-t-lg transition-colors ${
                        activeTab === 'history' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    <FaHistory className="inline mr-2" /> İade Taleplerim
                </button>
            </div>
            
            {/* Yeni İade Talebi Sekmesi */}
            {activeTab === 'new' && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h2 className="text-xl font-semibold mb-4 text-blue-700 border-b pb-2">Satın Aldığınız Ürünler</h2>
                    
                    {loadingProducts ? (
                        <div className="flex justify-center items-center py-10">
                            <FaSpinner className="animate-spin text-3xl text-blue-600" />
                        </div>
                    ) : purchasedProducts.length === 0 ? (
                        <div className="bg-yellow-50 p-4 rounded-md text-yellow-700">
                            <p>İade edilebilecek tamamlanmış bir siparişiniz bulunmuyor.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4 mb-6">
                                {purchasedProducts.map((item, index) => (
                                    <div key={`${item.product._id}-${index}`} className="flex flex-col sm:flex-row items-center p-4 border rounded-lg transition-colors hover:bg-blue-50">
                                        <div className="flex items-center w-full sm:w-auto mb-3 sm:mb-0">
                                            <input 
                                                type="checkbox" 
                                                id={`product-${item.product._id}-${index}`}
                                                checked={!!selectedProducts[item.product._id]}
                                                onChange={(e) => handleProductSelect(item, e.target.checked)}
                                                className="w-5 h-5 mr-4 accent-blue-600"
                                            />
                                            <div className="relative w-20 h-20 mr-4 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                                                <img 
                                                    src={item.product && item.product.images && item.product.images.length > 0 
                                                        ? item.product.images[0] 
                                                        : '/placeholder-image.jpg'
                                                    } 
                                                    alt={item.product ? item.product.name : 'Ürün'}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder-image.jpg'; }}
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="flex-grow text-center sm:text-left mb-3 sm:mb-0">
                                            <p className="font-semibold text-blue-900">{item.product.name}</p>
                                            <p className="text-sm text-gray-600">Sipariş No: {item.orderNumber}</p>
                                            <p className="text-sm text-gray-600">
                                                Sipariş Tarihi: {item.orderDate.toLocaleDateString('tr-TR')}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                Satın Alınan Miktar: <span className="font-medium">{item.quantity} adet</span>
                                            </p>
                                        </div>
                                        
                                        {selectedProducts[item.product._id] && (
                                            <div className="flex items-center">
                                                <label className="mr-2 text-blue-800 font-medium">İade Adedi:</label>
                                                <input 
                                                    type="number" 
                                                    value={selectedProducts[item.product._id].quantity}
                                                    onChange={(e) => handleQuantityChange(item, e.target.value)}
                                                    className="w-20 p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    min="1"
                                                    max={item.quantity}
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            
                            <div className="mb-6">
                                <label htmlFor="description" className="block text-lg font-semibold mb-2 text-blue-700">
                                    İade Nedeninizi Açıklayın (Zorunlu)
                                </label>
                                <textarea 
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                    rows="4"
                                    placeholder="Lütfen ürünleri neden iade etmek istediğinizi detaylı bir şekilde açıklayınız..."
                                />
                            </div>
                            
                            <div className="text-center">
                                <button 
                                    type="submit" 
                                    disabled={loading || Object.keys(selectedProducts).length === 0} 
                                    className="bg-blue-600 text-white py-3 px-8 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-semibold text-lg"
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center">
                                            <FaSpinner className="animate-spin mr-2" /> İşleniyor...
                                        </span>
                                    ) : 'İade Talebini Gönder'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}
            
            {/* İade Taleplerim Sekmesi */}
            {activeTab === 'history' && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h2 className="text-xl font-semibold mb-4 text-blue-700 border-b pb-2">İade Talepleriniz</h2>
                    
                    {loadingHistory ? (
                        <div className="flex justify-center items-center py-10">
                            <FaSpinner className="animate-spin text-3xl text-blue-600" />
                        </div>
                    ) : returnHistory.length === 0 ? (
                        <div className="bg-yellow-50 p-4 rounded-md text-yellow-700">
                            <p>Henüz iade talebiniz bulunmuyor.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Talep Tarihi
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Sipariş No
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Ürünler
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Durum
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            İşlemler
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {returnHistory.map((returnItem) => (
                                        <tr key={returnItem._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {new Date(returnItem.createdAt).toLocaleDateString('tr-TR')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {returnItem.order?.orderNumber || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">
                                                    {returnItem.products.map((prod, i) => (
                                                        <div key={i} className="mb-1">
                                                            {prod.product?.name || 'Bilinmeyen Ürün'} 
                                                            <span className="text-gray-500"> x {prod.quantity}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(returnItem.status)}`}>
                                                    {getStatusText(returnItem.status)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {returnItem.status === 'Beklemede' && (
                                                    <button
                                                        onClick={() => handleCancelReturn(returnItem._id)}
                                                        className="text-red-600 hover:text-red-900 font-medium text-sm"
                                                    >
                                                        İptal Et
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CreateReturnPage;
