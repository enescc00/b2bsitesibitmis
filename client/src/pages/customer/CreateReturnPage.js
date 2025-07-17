import React, { useState, useEffect, useMemo } from 'react';
import { FaBox, FaHistory, FaSpinner, FaSearch, FaExclamationTriangle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import apiRequest from '../../utils/apiHelper';

const CreateReturnPage = () => {
    const [activeTab, setActiveTab] = useState('new');
    const [purchasedItems, setPurchasedItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    // State to hold return details for each item: { uniqueKey: { quantity, description } }
    const [returnData, setReturnData] = useState({});
    const [returnHistory, setReturnHistory] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [error, setError] = useState(null);

    // Correctly construct image URLs with fallback when env variable is missing
    const baseApiUrl = ((process.env.REACT_APP_API_URL || window.location.origin).replace(/\/?api$/i, '')).replace(/\/$/, '');
    
    // Debug için console'a API URL bilgilerini yazdır
    console.log('API URL Debug:', {
        REACT_APP_API_URL: process.env.REACT_APP_API_URL,
        baseApiUrl: baseApiUrl,
        origin: window.location.origin
    });
    
    const getImageUrl = (path) => {
        // Path yoksa veya geçersizse placeholder döndür
        if (!path || path === 'undefined') return 'https://placehold.co/150x150';
        
        // Eğer path zaten tam URL ise doğrudan kullan
        if (path.startsWith('http')) return path;
        
        // Windows backslash'leri URL dostu slash'lere dönüştür
        const cleanPath = path.replace(/\\/g, '/').replace(/^\//, '');
        return `${baseApiUrl}/${cleanPath}`;
    };

    useEffect(() => {
        setError(null); // Her sekme değişikliğinde hata durumunu temizle
        if (activeTab === 'new') {
            fetchPurchasedItems();
        } else {
            fetchReturnHistory();
        }
    }, [activeTab]);

    useEffect(() => {
        try {
            // Eğer purchasedItems geçerli bir array değilse, filtreleme yapma
            if (!Array.isArray(purchasedItems)) {
                setFilteredItems([]);
                return;
            }
            
            const lowercasedFilter = (searchTerm || '').toLowerCase();
            const filtered = purchasedItems.filter(item => {
                if (!item || !item.product) return false;
                
                const productName = (item.product.name || '').toLowerCase();
                const orderNum = (item.orderNumber || '').toLowerCase();
                return productName.includes(lowercasedFilter) || orderNum.includes(lowercasedFilter);
            });
            
            setFilteredItems(filtered);
        } catch (error) {
            console.error('Filtreleme hatası:', error);
            setFilteredItems([]);
        }
    }, [searchTerm, purchasedItems]);

    const fetchPurchasedItems = async () => {
        setLoadingProducts(true);
        setError(null);
        try {
            const response = await apiRequest('/orders/myorders?status=Tamamlandı');
            const orders = await response.json();
            
            console.log('Siparişler alındı:', orders);
            
            if (!Array.isArray(orders)) {
                throw new Error('Sipariş verisi bir dizi değil: ' + JSON.stringify(orders));
            }
            
            const allItems = orders.flatMap(order => {
                if (!order || !order.orderItems) return [];
                
                return order.orderItems
                    .filter(item => item && item.product) // Geçersiz öğeleri filtrele
                    .map(item => ({
                        ...item,
                        orderDate: new Date(order.createdAt || Date.now()),
                        orderNumber: order.orderNumber || 'Bilinmiyor', 
                        orderId: order._id
                    }));
            });
            
            // Tarih sıralaması
            allItems.sort((a, b) => b.orderDate - a.orderDate);
            setPurchasedItems(allItems);
            
            console.log('İşlenen ürünler:', allItems);
        } catch (error) {
            console.error('Sipariş verileri yüklenirken hata:', error);
            toast.error('Satın alınan ürünler yüklenirken bir hata oluştu.');
            setError('Siparişler yüklenemedi. Lütfen daha sonra tekrar deneyin.');
            setPurchasedItems([]);
        } finally {
            setLoadingProducts(false);
        }
    };

    const fetchReturnHistory = async () => {
        setLoadingHistory(true);
        setError(null);
        try {
            const response = await apiRequest('/returns');
            const data = await response.json();
            
            if (!Array.isArray(data)) {
                throw new Error('İade geçmişi verisi bir dizi değil: ' + JSON.stringify(data));
            }
            
            setReturnHistory(data);
            console.log('İade geçmişi alındı:', data);
        } catch (error) {
            console.error('İade geçmişi yüklenirken hata:', error);
            toast.error('İade geçmişi yüklenirken bir hata oluştu.');
            setError('İade geçmişi yüklenemedi. Lütfen daha sonra tekrar deneyin.');
            setReturnHistory([]);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleReturnDataChange = (uniqueKey, field, value) => {
        setReturnData(prev => {
            try {
                const currentItem = { ...prev[uniqueKey] };
                // Güvenli bir şekilde itemDetails'i bul, bulamazsa null kullan
                const itemDetails = purchasedItems.find(p => p && p.product && p.orderId && 
                    `${p.orderId}-${p.product._id}` === uniqueKey);
                
                if (!itemDetails) {
                    console.error('Ürün detayları bulunamadı:', uniqueKey);
                    return prev; // Değişiklik yapma
                }

                if (field === 'quantity') {
                    const numValue = parseInt(value, 10);
                    if (isNaN(numValue) || numValue < 0) {
                        value = 0;
                    } else if (numValue > itemDetails.quantity) {
                        toast.warn(`En fazla ${itemDetails.quantity} adet iade edebilirsiniz.`);
                        value = itemDetails.quantity;
                    }
                }
                
                const updatedItem = { ...currentItem, [field]: value };

                // If quantity is 0, remove the item from returnData
                if (updatedItem.quantity === 0 || updatedItem.quantity === '') {
                    const newReturnData = { ...prev };
                    delete newReturnData[uniqueKey];
                    return newReturnData;
                }

                return { ...prev, [uniqueKey]: updatedItem };
            } catch (error) {
                console.error('handleReturnDataChange hatası:', error);
                return prev; // Hata durumunda mevcut state'i koru
            }
        });
    };

    const isSubmitDisabled = useMemo(() => {
        if (loading || Object.keys(returnData).length === 0) return true;
        // Check if every item in returnData has a quantity > 0 and a non-empty description
        return Object.values(returnData).some(item => !item.quantity || parseInt(item.quantity) === 0 || !item.description?.trim());
    }, [returnData, loading]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitDisabled) {
            toast.error('Lütfen iade edilecek tüm ürünlerin miktarını ve açıklamasını girin.');
            return;
        }

        setLoading(true);

        try {
            const returnsByOrder = Object.entries(returnData).reduce((acc, [uniqueKey, data]) => {
                try {
                    // uniqueKey'in geçerli olduğundan emin ol
                    if (!uniqueKey || !uniqueKey.includes('-')) {
                        console.error('Geçersiz uniqueKey:', uniqueKey);
                        return acc;
                    }
                    
                    const [orderId, productId] = uniqueKey.split('-');
                    
                    if (!orderId || !productId) {
                        console.error('Geçersiz orderId veya productId:', {orderId, productId});
                        return acc;
                    }

                    if (!acc[orderId]) {
                        acc[orderId] = [];
                    }
                    
                    acc[orderId].push({ 
                        product: productId, 
                        quantity: parseInt(data.quantity, 10), 
                        description: data.description 
                    });
                    
                    return acc;
                } catch (err) {
                    console.error('returnsByOrder işlenirken hata:', err);
                    return acc;
                }
            }, {});

            console.log('İade verileri:', returnsByOrder);
            
            // Eğer hiç sipariş yoksa hata göster
            if (Object.keys(returnsByOrder).length === 0) {
                throw new Error('İade edilecek ürün bulunamadı');
            }

            const returnPromises = Object.entries(returnsByOrder).map(([orderId, products]) => {
                // Her sipariş için ortak açıklama olarak ilk ürünün açıklamasını kullan
                const description = products[0].description;
                
                console.log(`${orderId} için iade isteği gönderiliyor:`, {products, description});
                
                return apiRequest('/returns', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ orderId, products, description })
                });
            });

            await Promise.all(returnPromises);

            toast.success('İade talepleriniz başarıyla oluşturuldu!');
            setReturnData({});
            setSearchTerm('');
            setActiveTab('history');
        } catch (error) {
            console.error('İade gönderiminde hata:', error);
            
            let errorMessage = 'İade talebi oluşturulurken bir hata oluştu.';
            
            try {
                // Hata yanıtını JSON olarak parse etmeye çalış
                if (error.response) {
                    const errorData = await error.response.json();
                    errorMessage = errorData?.msg || errorMessage;
                }
            } catch (jsonError) {
                console.error('JSON parse hatası:', jsonError);
            }
            
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // ... (keep getStatusColor, getStatusText, handleCancelReturn as they are)
    const getStatusColor = (status) => {
        switch (status) {
            case 'İade Talebi Oluşturuldu': return 'bg-yellow-100 text-yellow-800';
            case 'Onaylandı': case 'Tamamlandı': return 'bg-green-100 text-green-800';
            case 'Reddedildi': return 'bg-red-100 text-red-800';
            case 'İncelemede': case 'İade Teslim Alındı': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    const getStatusText = (status) => status || 'Bilinmiyor';
    const handleCancelReturn = async (returnId) => {
        if (!window.confirm('Bu iade talebini iptal etmek istediğinizden emin misiniz?')) return;
        try {
            await apiRequest(`/returns/${returnId}/cancel`, { method: 'PUT' });
            toast.success('İade talebi başarıyla iptal edildi.');
            fetchReturnHistory();
        } catch (error) {
            toast.error('İade talebi iptal edilirken bir hata oluştu.');
        }
    };


    return (
        <div className="container mx-auto p-4 font-sans">
            <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">İade Yönetimi</h1>
            <div className="flex justify-center border-b border-gray-200 mb-6">
                <button onClick={() => setActiveTab('new')} className={`py-3 px-8 font-semibold text-base transition-colors border-b-4 ${activeTab === 'new' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-blue-600'}`}><FaBox className="inline mr-2" /> Yeni İade Talebi</button>
                <button onClick={() => setActiveTab('history')} className={`py-3 px-8 font-semibold text-base transition-colors border-b-4 ${activeTab === 'history' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-blue-600'}`}><FaHistory className="inline mr-2" /> İade Geçmişim</button>
            </div>

            {activeTab === 'new' && (
                <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
                    <h2 className="text-2xl font-semibold mb-2 text-gray-700">İade Edilecek Ürünleri Belirtin</h2>
                    <p className="text-gray-500 mb-6">Geçmiş siparişlerinizden iade etmek istediğiniz ürünlerin miktarını ve nedenini belirtin.</p>
                    {loadingProducts ? (
                        <div className="flex justify-center items-center py-16"><FaSpinner className="animate-spin text-4xl text-blue-500" /></div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-10 bg-red-50 rounded-lg text-center">
                            <FaExclamationTriangle className="text-red-500 text-3xl mb-2" />
                            <p className="text-red-700">{error}</p>
                            <button 
                                onClick={() => fetchPurchasedItems()} 
                                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                            >
                                Yeniden Dene
                            </button>
                        </div>
                    ) : purchasedItems.length === 0 ? (
                        <div className="text-center py-10 bg-gray-50 rounded-lg">
                            <p className="text-gray-600">İade edilebilecek bir ürün bulunamadı.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="mb-6">
                                <div className="relative"><span className="absolute inset-y-0 left-0 flex items-center pl-3"><FaSearch className="text-gray-400" /></span><input type="text" placeholder="Ürün adı veya sipariş no ile ara..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" /></div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Görsel</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ürün Bilgisi</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alınan Miktar</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İade Miktarı</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Açıklama</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredItems.map(item => {
                                            const uniqueKey = `${item.orderId}-${item.product._id}`;
                                            const isSelected = !!returnData[uniqueKey];
                                            return (
                                                <tr key={uniqueKey} className={`${isSelected ? 'bg-green-50' : ''}`}>
                                                    <td className="px-4 py-4">
                                                        {/* Debug için resimlerin kaynak URL'ini göster */}
                                                        {/* <div className="text-xs text-gray-400 mb-1">
                                                            {item.product?.images?.[0] || 'Resim yok'}
                                                        </div> */}
                                                        <img 
                                                            src={getImageUrl(item.product?.images?.[0])} 
                                                            alt={item.product?.name} 
                                                            className="w-16 h-16 object-cover rounded-md bg-gray-100" 
                                                            onError={(e) => { 
                                                                console.log('Resim yüklenemedi:', e.target.src);
                                                                e.target.onerror = null; 
                                                                e.target.src = 'https://placehold.co/150x150'; 
                                                            }} 
                                                        />
                                                    </td>
                                                    <td className="px-4 py-4 align-top">
                                                        <p className="font-bold text-sm text-gray-900">{item.product.name}</p>
                                                        <p className="text-xs text-gray-500">Sipariş No: {item.orderNumber}</p>
                                                    </td>
                                                    <td className="px-4 py-4 align-top"><span className="text-sm font-medium">{item.quantity}</span></td>
                                                    <td className="px-4 py-4 align-top">
                                                        <input type="number" value={returnData[uniqueKey]?.quantity || ''} onChange={(e) => handleReturnDataChange(uniqueKey, 'quantity', e.target.value)} className="w-20 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="0" min="0" max={item.quantity} />
                                                    </td>
                                                    <td className="px-4 py-4 align-top">
                                                        <input type="text" value={returnData[uniqueKey]?.description || ''} onChange={(e) => handleReturnDataChange(uniqueKey, 'description', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="İade nedeni..." disabled={!isSelected} />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-8 text-center">
                                <button type="submit" disabled={isSubmitDisabled} className={`py-3 px-12 text-lg font-semibold text-white rounded-lg transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 ${isSubmitDisabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}>
                                    {loading ? <span className="flex items-center justify-center"><FaSpinner className="animate-spin mr-2" /> Gönderiliyor...</span> : 'İade Talebi Oluştur'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}

            {activeTab === 'history' && (
                 <div className="bg-white rounded-xl shadow-lg p-8">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-700">İade Geçmişim</h2>
                    {loadingHistory ? (
                        <div className="flex justify-center items-center py-16"><FaSpinner className="animate-spin text-4xl text-blue-500" /></div>
                    ) : returnHistory.length === 0 ? (
                        <div className="text-center py-10 bg-gray-50 rounded-lg"><p className="text-gray-600">Daha önce oluşturulmuş bir iade talebiniz yok.</p></div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Talep Tarihi</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sipariş No</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ürünler</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {returnHistory.map((returnItem) => (
                                        <tr key={returnItem._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(returnItem.createdAt).toLocaleDateString('tr-TR')}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{returnItem.order?.orderNumber || 'N/A'}</td>
                                            <td className="px-6 py-4 text-sm text-gray-800">
                                                {returnItem.products.map((prod, i) => (
                                                    <div key={i}>{prod.product?.name || 'Bilinmeyen Ürün'} <span className="text-gray-500">x {prod.quantity}</span></div>
                                                ))}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(returnItem.status)}`}>{getStatusText(returnItem.status)}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                {returnItem.status === 'İade Talebi Oluşturuldu' && (
                                                    <button onClick={() => handleCancelReturn(returnItem._id)} className="text-red-600 hover:text-red-800 transition">İptal Et</button>
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
