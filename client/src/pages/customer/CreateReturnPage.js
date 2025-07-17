import React, { useState, useEffect } from 'react';
import apiRequest from '../../utils/apiHelper';
import { toast } from 'react-toastify';
import { FaBox, FaHistory, FaArrowLeft, FaSearch, FaSpinner } from 'react-icons/fa';

const CreateReturnPage = () => {
    // Ana durum değişkenleri
    const [activeTab, setActiveTab] = useState('new'); // 'new' veya 'history'
    const [purchasedProducts, setPurchasedProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState({}); // { productId: { quantity, orderId, productDetails } }
    const [returnHistory, setReturnHistory] = useState([]);
    const [description, setDescription] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [loadingHistory, setLoadingHistory] = useState(true);

    useEffect(() => {
        fetchAllPurchasedProducts();
        fetchReturnHistory();
    }, []);

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
    
    // Tüm tamamlanmış siparişlerdeki ürünleri getir
    const fetchAllPurchasedProducts = async () => {
        setLoadingProducts(true);
        try {
            const data = await apiRequest('/orders/myorders?status=Tamamlandı').then(r => r.json());
            const allProducts = data.flatMap(order => 
                order.orderItems?.map(item => ({...item, orderDate: new Date(order.createdAt), orderNumber: order.orderNumber, orderId: order._id})) || []
            );
            allProducts.sort((a, b) => b.orderDate - a.orderDate);
            setPurchasedProducts(allProducts);
            setFilteredProducts(allProducts);
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
            // API yolu düzeltildi: /returns/myreturns -> /returns
            const data = await apiRequest('/returns').then(r => r.json());
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
            <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">İade Yönetimi</h1>
            
            <div className="flex justify-center border-b border-gray-300 mb-6">
                <button 
                    onClick={() => setActiveTab('new')}
                    className={`py-3 px-8 font-semibold text-lg transition-colors border-b-4 ${activeTab === 'new' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-blue-600'}`}>
                    <FaBox className="inline mr-2" /> Yeni İade Talebi
                </button>
                <button 
                    onClick={() => setActiveTab('history')}
                    className={`py-3 px-8 font-semibold text-lg transition-colors border-b-4 ${activeTab === 'history' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-blue-600'}`}>
                    <FaHistory className="inline mr-2" /> İade Geçmişim
                </button>
            </div>
            
            {activeTab === 'new' && (
                <div className="bg-white rounded-xl shadow-md p-8">
                    <h2 className="text-2xl font-semibold mb-2 text-gray-700">İade Edilecek Ürünleri Seçin</h2>
                    <p className="text-gray-500 mb-6">Geçmiş siparişlerinizdeki ürünleri listeleyin, arayın ve iade talebi oluşturun.</p>
                    
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
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                        <FaSearch className="text-gray-400" />
                                    </span>
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
                                {filteredProducts.map((item, index) => (
                                    <div key={`${item.product._id}-${index}`} className={`p-4 border rounded-lg flex items-start gap-4 transition-all ${selectedProducts[item.product._id] ? 'bg-blue-50 border-blue-300' : 'bg-white hover:border-gray-300'}`}>
                                        <input 
                                            type="checkbox" 
                                            id={`product-${item.product._id}-${index}`}
                                            checked={!!selectedProducts[item.product._id]}
                                            onChange={(e) => handleProductSelect(item, e.target.checked)}
                                            className="mt-1 w-5 h-5 accent-blue-600 flex-shrink-0"
                                        />
                                        <img 
                                            src={item.product?.images?.[0] || 'https://via.placeholder.com/150'}
                                            alt={item.product?.name || 'Ürün'}
                                            className="w-24 h-24 object-cover rounded-md bg-gray-100"
                                            onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/150'; }}
                                        />
                                        <div className="flex-grow">
                                            <p className="font-bold text-lg text-gray-800">{item.product.name}</p>
                                            <div className="text-sm text-gray-500 mt-1">
                                                <span>Sipariş No: <span className="font-medium text-gray-600">{item.orderNumber}</span></span>
                                                <span className="mx-2">|</span>
                                                <span>Tarih: <span className="font-medium text-gray-600">{item.orderDate.toLocaleDateString('tr-TR')}</span></span>
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                <span>Satın Alınan: <span className="font-medium text-gray-600">{item.quantity} adet</span></span>
                                            </div>
                                        </div>
                                        {selectedProducts[item.product._id] && (
                                            <div className="flex items-center gap-2">
                                                <label className="text-sm font-medium text-gray-700">İade Adedi:</label>
                                                <input 
                                                    type="number" 
                                                    value={selectedProducts[item.product._id].quantity}
                                                    onChange={(e) => handleQuantityChange(item, e.target.value)}
                                                    className="w-20 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    min="1"
                                                    max={item.quantity}
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            
                            <div className="mb-6">
                                <label htmlFor="description" className="block text-lg font-semibold mb-2 text-gray-700">İade Nedeni</label>
                                <textarea 
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-y"
                                    rows="4"
                                    placeholder="Lütfen iade nedeninizi kısaca açıklayınız..."
                                />
                            </div>
                            
                            <div className="text-center">
                                <button 
                                    type="submit" 
                                    disabled={loading || Object.keys(selectedProducts).length === 0}
                                    className="bg-blue-600 text-white py-3 px-10 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all font-semibold text-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                                >
                                    {loading ? <span className="flex items-center"><FaSpinner className="animate-spin mr-2" /> Gönderiliyor...</span> : 'İade Talebi Oluştur'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}
            
            {activeTab === 'history' && (
                <div className="bg-white rounded-xl shadow-md p-8">
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
                                                {returnItem.status === 'Beklemede' && (
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
