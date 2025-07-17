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
            if (!Array.isArray(purchasedItems)) {
                setFilteredItems([]);
                return;
            }
            
            const lowercasedFilter = (searchTerm || '').toLowerCase();
            const filtered = purchasedItems.filter(item => {
                if (!item || !item.product) return false;
                
                // Hata düzeltmesi: Değerleri string'e çevirerek toLowerCase çağır
                const productName = String(item.product.name || '').toLowerCase();
                const orderNum = String(item.orderNumber || '').toLowerCase();
                
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


    const TabButton = ({ tabName, currentTab, setTab, children }) => (
        <button
            onClick={() => setTab(tabName)}
            className={`relative px-4 py-2 text-sm font-semibold transition-colors duration-300 ${
                currentTab === tabName
                    ? 'text-blue-600'
                    : 'text-gray-500 hover:text-gray-800'
            }`}>
            {children}
            {currentTab === tabName && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-full" />
            )}
        </button>
    );

    return (
        <div className="container mx-auto p-4 font-sans">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
                <h1 className="text-3xl font-bold text-gray-800">İade Yönetimi</h1>
                <div className="flex border border-gray-200 rounded-lg p-1">
                    <TabButton tabName="new" currentTab={activeTab} setTab={setActiveTab}><FaBox className="mr-2"/>Yeni İade Talebi</TabButton>
                    <TabButton tabName="history" currentTab={activeTab} setTab={setActiveTab}><FaHistory className="mr-2"/>İade Geçmişim</TabButton>
                </div>
            </div>

            <main>
                {activeTab === 'new' && (
                    <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
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
                                <div className="relative w-full sm:w-72">
                                    <FaSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Ürün veya sipariş no ile ara..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                    />
                                </div>

                                <div className="overflow-x-auto mt-4">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Görsel</th>
                                                <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Ürün Bilgisi</th>
                                                <th scope="col" className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Alınan</th>
                                                <th scope="col" className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">İade Miktarı</th>
                                                <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">İade Nedeni</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {filteredItems.map(item => {
                                                const uniqueKey = `${item.orderId}-${item.product._id}`;
                                                const isSelected = !!returnData[uniqueKey];
                                                return (
                                                    <tr key={uniqueKey} className={`${isSelected ? 'bg-green-50' : ''}`}>
                                                        <td className="px-4 py-4">
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
                                                            <p className="text-xs text-gray-500">Tarih: {new Date(item.orderDate).toLocaleDateString()}</p>
                                                        </td>
                                                        <td className="px-4 py-4 align-top text-center font-medium text-gray-800">{item.quantity}</td>
                                                        <td className="px-4 py-4 align-top">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max={item.quantity}
                                                                value={returnData[uniqueKey]?.quantity || ''}
                                                                onChange={(e) => handleReturnDataChange(uniqueKey, 'quantity', e.target.value)}
                                                                className="w-24 p-2 border border-gray-300 rounded-md text-center focus:ring-2 focus:ring-blue-500"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-4 align-top">
                                                            <input
                                                                type="text"
                                                                placeholder="İade nedenini belirtin..."
                                                                value={returnData[uniqueKey]?.description || ''}
                                                                onChange={(e) => handleReturnDataChange(uniqueKey, 'description', e.target.value)}
                                                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 transition-all duration-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                                disabled={!isSelected}
                                                            />
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-8 text-right">
                                    <button 
                                        type="submit" 
                                        disabled={isSubmitDisabled} 
                                        className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300"
                                    >
                                        İade Talebi Oluştur
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
                        <h2 className="text-2xl font-semibold mb-6 text-gray-700">İade Geçmişi</h2>
                        {loadingHistory ? (
                            <div className="flex justify-center items-center py-16"><FaSpinner className="animate-spin text-4xl text-blue-500" /></div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center py-10 bg-red-50 rounded-lg text-center">
                                <FaExclamationTriangle className="text-red-500 text-3xl mb-2" />
                                <p className="text-red-700">{error}</p>
                                <button 
                                    onClick={() => fetchReturnHistory()} 
                                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                >
                                    Yeniden Dene
                                </button>
                            </div>
                        ) : returnHistory.length === 0 ? (
                            <div className="text-center py-10 bg-gray-50 rounded-lg"><p className="text-gray-600">Daha önce oluşturulmuş bir iade talebiniz bulunmamaktadır.</p></div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sipariş No</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ürünler</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {returnHistory.map(ret => (
                                            <tr key={ret._id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ret.orderId.orderNumber}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(ret.createdAt).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${ret.status === 'Onaylandı' ? 'bg-green-100 text-green-800' : ret.status === 'Reddedildi' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                        {ret.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    <ul>
                                                        {ret.products.map(p => (
                                                            <li key={p.product._id}>{p.product.name} - {p.quantity} adet</li>
                                                        ))}
                                                    </ul>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default CreateReturnPage;
