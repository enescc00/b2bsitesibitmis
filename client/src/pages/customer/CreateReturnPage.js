import React, { useState, useEffect, useMemo } from 'react';
import { FaBox, FaHistory, FaSpinner, FaSearch, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
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

    // Correctly construct image URLs with fallback when env variable is missing
    const baseApiUrl = ((process.env.REACT_APP_API_URL || window.location.origin).replace(/\/?api$/i, '')).replace(/\/$/, '');
    const getImageUrl = (path) => {
        if (!path) return 'https://placehold.co/150x150';
        if (path.startsWith('http')) return path;
        // Ensure windows backslashes are converted to URL-friendly slashes
        const cleanPath = path.replace(/\\/g, '/').replace(/^\//, '');
        return `${baseApiUrl}/${cleanPath}`;
    };

    useEffect(() => {
        if (activeTab === 'new') {
            fetchPurchasedItems();
        } else {
            fetchReturnHistory();
        }
    }, [activeTab]);

    useEffect(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        const filtered = purchasedItems.filter(item => {
            const productName = item.product?.name?.toLowerCase() || '';
            const orderNum = item.orderNumber?.toLowerCase() || '';
            return productName.includes(lowercasedFilter) || orderNum.includes(lowercasedFilter);
        });
        setFilteredItems(filtered);
    }, [searchTerm, purchasedItems]);

    const fetchPurchasedItems = async () => {
        setLoadingProducts(true);
        try {
            const orders = await apiRequest('/orders/myorders?status=Tamamlandı').then(r => r.json());
            const allItems = orders.flatMap(order =>
                order.orderItems?.map(item => ({ ...item, orderDate: new Date(order.createdAt), orderNumber: order.orderNumber, orderId: order._id })) || []
            );
            allItems.sort((a, b) => b.orderDate - a.orderDate);
            setPurchasedItems(allItems);
        } catch (error) {
            toast.error('Satın alınan ürünler yüklenirken bir hata oluştu.');
        } finally {
            setLoadingProducts(false);
        }
    };

    const fetchReturnHistory = async () => {
        setLoadingHistory(true);
        try {
            const data = await apiRequest('/returns').then(r => r.json());
            setReturnHistory(data);
        } catch (error) {
            toast.error('İade geçmişi yüklenirken bir hata oluştu.');
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleReturnDataChange = (uniqueKey, field, value) => {
        setReturnData(prev => {
            const currentItem = { ...prev[uniqueKey] };
            const itemDetails = purchasedItems.find(p => `${p.orderId}-${p.product._id}` === uniqueKey);

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

        const returnsByOrder = Object.entries(returnData).reduce((acc, [uniqueKey, data]) => {
            const orderId = uniqueKey.split('-')[0];
            const productId = uniqueKey.split('-')[1];

            if (!acc[orderId]) {
                acc[orderId] = [];
            }
            acc[orderId].push({ 
                product: productId, 
                quantity: data.quantity, 
                description: data.description 
            });
            return acc;
        }, {});

        try {
            const returnPromises = Object.entries(returnsByOrder).map(([orderId, products]) => {
                // The backend expects a single description, so we'll send the one from the first product.
                // This might need backend adjustment if per-item descriptions are required.
                const description = products[0].description;
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
            const errorData = await error.response?.json().catch(() => null);
            toast.error(errorData?.msg || 'İade talebi oluşturulurken bir hata oluştu.');
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
                    ) : purchasedItems.length === 0 ? (
                        <div className="text-center py-10 bg-gray-50 rounded-lg"><p className="text-gray-600">İade edilebilecek bir ürün bulunamadı.</p></div>
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
                                                    <td className="px-4 py-4"><img src={getImageUrl(item.product?.images?.[0])} alt={item.product.name} className="w-16 h-16 object-cover rounded-md bg-gray-100" onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/150x150'; }} /></td>
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
