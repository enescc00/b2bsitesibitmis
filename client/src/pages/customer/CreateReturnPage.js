import React, { useState, useEffect } from 'react';
import { FaBox, FaHistory, FaSpinner, FaSearch } from 'react-icons/fa';
import { toast } from 'react-toastify';
import apiRequest from '../../utils/apiHelper';

const CreateReturnPage = () => {
    const [activeTab, setActiveTab] = useState('new');
    const [purchasedProducts, setPurchasedProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState({}); // Key: uniqueKey, Value: { product, quantity, orderId, maxQuantity }
    const [returnHistory, setReturnHistory] = useState([]);
    const [description, setDescription] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [loadingHistory, setLoadingHistory] = useState(true);

    useEffect(() => {
        if (activeTab === 'new') {
            fetchAllPurchasedProducts();
        } else {
            fetchReturnHistory();
        }
    }, [activeTab]);

    useEffect(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        const filtered = purchasedProducts.filter(item => {
            const productName = item.product?.name || '';
            const orderNum = item.orderNumber || '';
            return productName.toLowerCase().includes(lowercasedFilter) ||
                   orderNum.toLowerCase().includes(lowercasedFilter);
        });
        setFilteredProducts(filtered);
    }, [searchTerm, purchasedProducts]);
    
    const fetchAllPurchasedProducts = async () => {
        setLoadingProducts(true);
        try {
            const data = await apiRequest('/orders/myorders?status=Tamamlandı').then(r => r.json());
            const allProducts = data.flatMap(order => 
                order.orderItems?.map(item => ({...item, orderDate: new Date(order.createdAt), orderNumber: order.orderNumber, orderId: order._id})) || []
            );
            allProducts.sort((a, b) => b.orderDate - a.orderDate);
            setPurchasedProducts(allProducts);
        } catch (error) {
            console.error('Products fetch error:', error);
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
            console.error('Return history fetch error:', error);
            toast.error('İade geçmişi yüklenirken bir hata oluştu.');
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleProductSelect = (item, isChecked) => {
        const uniqueKey = `${item.orderId}-${item.product._id}`;
        setSelectedProducts(prev => {
            const newSelected = { ...prev };
            if (isChecked) {
                newSelected[uniqueKey] = { 
                    product: item.product,
                    quantity: 1, // Default to 1 when selected
                    orderId: item.orderId,
                    maxQuantity: item.quantity
                };
            } else {
                delete newSelected[uniqueKey];
            }
            return newSelected;
        });
    };

    const handleQuantityChange = (item, quantity) => {
        const uniqueKey = `${item.orderId}-${item.product._id}`;
        const numQuantity = parseInt(quantity, 10);

        if (isNaN(numQuantity) || numQuantity < 1) {
            // If quantity is invalid, we can either reset to 1 or remove it.
            // For better UX, let's just cap it at 1.
            setSelectedProducts(prev => ({
                ...prev,
                [uniqueKey]: { ...prev[uniqueKey], quantity: 1 }
            }));
            return;
        }

        if (numQuantity > item.quantity) {
            toast.warn(`En fazla ${item.quantity} adet iade edebilirsiniz.`);
            setSelectedProducts(prev => ({
                ...prev,
                [uniqueKey]: { ...prev[uniqueKey], quantity: item.quantity }
            }));
            return;
        }

        setSelectedProducts(prev => ({
            ...prev,
            [uniqueKey]: { ...prev[uniqueKey], quantity: numQuantity }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const itemsToReturn = Object.values(selectedProducts);
        if (itemsToReturn.length === 0) {
            toast.error('Lütfen iade edilecek en az bir ürün seçin.');
            return;
        }
        if (!description.trim()) {
            toast.error('Lütfen iade nedenini açıklayınız.');
            return;
        }

        setLoading(true);

        const returnsByOrder = itemsToReturn.reduce((acc, item) => {
            if (!acc[item.orderId]) {
                acc[item.orderId] = [];
            }
            acc[item.orderId].push({ product: item.product._id, quantity: item.quantity });
            return acc;
        }, {});

        try {
            const returnPromises = Object.entries(returnsByOrder).map(([orderId, products]) => {
                return apiRequest('/returns', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ orderId, products, description })
                });
            });

            await Promise.all(returnPromises);

            toast.success('İade talepleriniz başarıyla oluşturuldu!');
            setSelectedProducts({});
            setDescription('');
            setSearchTerm('');
            setActiveTab('history');

        } catch (error) {
            console.error('Return submission error:', error);
            const errorMsg = await error.response?.json();
            toast.error(errorMsg?.msg || 'İade talebi oluşturulurken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

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

    const getStatusColor = (status) => {
        switch (status) {
            case 'İade Talebi Oluşturuldu': return 'bg-yellow-100 text-yellow-800';
            case 'Onaylandı':
            case 'Tamamlandı': return 'bg-green-100 text-green-800';
            case 'Reddedildi': return 'bg-red-100 text-red-800';
            case 'İncelemede':
            case 'İade Teslim Alındı': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusText = (status) => status || 'Bilinmiyor';

    return (
        <div className="container mx-auto p-4 font-sans">
            <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">İade Yönetimi</h1>
            
            <div className="flex justify-center border-b border-gray-200 mb-6">
                <button 
                    onClick={() => setActiveTab('new')}
                    className={`py-3 px-8 font-semibold text-base transition-colors border-b-4 ${activeTab === 'new' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-blue-600'}`}>
                    <FaBox className="inline mr-2" /> Yeni İade Talebi
                </button>
                <button 
                    onClick={() => setActiveTab('history')}
                    className={`py-3 px-8 font-semibold text-base transition-colors border-b-4 ${activeTab === 'history' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-blue-600'}`}>
                    <FaHistory className="inline mr-2" /> İade Geçmişim
                </button>
            </div>
            
            {activeTab === 'new' && (
                <div className="bg-white rounded-xl shadow-lg p-8">
                    <h2 className="text-2xl font-semibold mb-2 text-gray-700">İade Edilecek Ürünleri Seçin</h2>
                    <p className="text-gray-500 mb-6">Geçmiş siparişlerinizdeki ürünleri listeleyin ve iade talebi oluşturun.</p>
                    
                    {loadingProducts ? (
                        <div className="flex justify-center items-center py-16"><FaSpinner className="animate-spin text-4xl text-blue-500" /></div>
                    ) : purchasedProducts.length === 0 ? (
                        <div className="text-center py-10 bg-gray-50 rounded-lg">
                            <p className="text-gray-600">İade edilebilecek bir ürün bulunamadı.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="mb-6">
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3"><FaSearch className="text-gray-400" /></span>
                                    <input
                                        type="text"
                                        placeholder="Ürün adı veya sipariş no ile ara..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3 mb-6 max-h-[50vh] overflow-y-auto pr-2">
                                {filteredProducts.map((item) => {
                                    const uniqueKey = `${item.orderId}-${item.product._id}`;
                                    const isSelected = !!selectedProducts[uniqueKey];

                                    return (
                                        <div key={uniqueKey} className={`p-4 border rounded-lg flex items-start gap-4 transition-all ${isSelected ? 'bg-blue-50 border-blue-300 shadow-sm' : 'bg-white hover:border-gray-400'}`}>
                                            <input 
                                                type="checkbox" 
                                                id={uniqueKey}
                                                checked={isSelected}
                                                onChange={(e) => handleProductSelect(item, e.target.checked)}
                                                className="mt-1 w-5 h-5 accent-blue-600 flex-shrink-0 cursor-pointer"
                                            />
                                            <img 
                                                src={item.product?.images?.[0] || 'https://placehold.co/150'}
                                                alt={item.product?.name || 'Ürün'}
                                                className="w-24 h-24 object-cover rounded-md bg-gray-100"
                                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/150'; }}
                                            />
                                            <div className="flex-grow">
                                                <p className="font-bold text-lg text-gray-800">{item.product.name}</p>
                                                <div className="text-sm text-gray-500 mt-1 space-x-2">
                                                    <span>Sipariş No: <span className="font-medium text-gray-700">{item.orderNumber}</span></span>
                                                    <span className="text-gray-300">|</span>
                                                    <span>Tarih: <span className="font-medium text-gray-700">{new Date(item.orderDate).toLocaleDateString('tr-TR')}</span></span>
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    <span>Satın Alınan: <span className="font-medium text-gray-700">{item.quantity} adet</span></span>
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <div className="flex items-center gap-2">
                                                    <label htmlFor={`quantity-${uniqueKey}`} className="text-sm font-medium text-gray-700">İade Adedi:</label>
                                                    <input 
                                                        type="number" 
                                                        id={`quantity-${uniqueKey}`}
                                                        value={selectedProducts[uniqueKey].quantity}
                                                        onChange={(e) => handleQuantityChange(item, e.target.value)}
                                                        className="w-24 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                        min="1"
                                                        max={item.quantity}
                                                        onClick={(e) => e.stopPropagation()} // Prevent card selection on click
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            
                            <div className="mb-6">
                                <label htmlFor="description" className="block text-lg font-semibold mb-2 text-gray-700">İade Nedeni (Tüm Seçili Ürünler İçin Ortak)</label>
                                <textarea 
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-y"
                                    rows="4"
                                    placeholder="Lütfen iade nedeninizi kısaca açıklayınız..."
                                    required
                                />
                            </div>
                            
                            <div className="text-center">
                                <button 
                                    type="submit" 
                                    disabled={loading || Object.keys(selectedProducts).length === 0}
                                    className="bg-blue-600 text-white py-3 px-10 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all font-semibold text-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                                >
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
                        <div className="text-center py-10 bg-gray-50 rounded-lg">
                            <p className="text-gray-600">Daha önce oluşturulmuş bir iade talebiniz yok.</p>
                        </div>
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
