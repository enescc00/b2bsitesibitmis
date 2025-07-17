import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import apiRequest from '../../utils/apiHelper';
import { toast } from 'react-toastify';

const ReturnDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const [returnRequest, setReturnRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('');
    const [notes, setNotes] = useState('');
    const [financials, setFinancials] = useState([]);

    const fetchReturn = async () => {
        try {
            const data = await apiRequest(`/returns/${id}`).then(r=>r.json());
            setReturnRequest(data);
            setStatus(data.status);
            // Finansal işlem için ürünleri hazırla
            const financialItems = data.products.map(p => ({ 
                productId: p.product._id, 
                name: p.product.name,
                quantity: p.quantity,
                priceAtReturn: p.priceAtReturn || 0
            }));
            setFinancials(financialItems);

        } catch (error) {
            toast.error('İade detayı getirilirken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReturn();
    }, [id]);

    const handleStatusUpdate = async () => {
        if (status === returnRequest.status) {
            toast.info('Durum değiştirilmedi.');
            return;
        }
        try {
            await api.put(`/api/returns/${id}/status`, { status, notes });
            toast.success('İade durumu başarıyla güncellendi.');
            fetchReturn(); // Sayfayı yenile
            setNotes('');
        } catch (error) {
            toast.error(error.response?.data?.msg || 'Durum güncellenirken bir hata oluştu.');
        }
    };

    const handleFinancialProcess = async () => {
        if (window.confirm('Bu işlemi onaylamak, iade tutarını müşteri cari hesabından düşecektir. Emin misiniz?')) {
            try {
                await api.post(`/api/returns/${id}/process-financials`, { productsWithPrices: financials });
                toast.success('Finansal işlem başarıyla tamamlandı.');
                fetchReturn(); // Sayfayı yenile
            } catch (error) {
                toast.error(error.response?.data?.msg || 'Finansal işlem sırasında bir hata oluştu.');
            }
        }
    };

    const handlePriceChange = (productId, price) => {
        setFinancials(financials.map(f => f.productId === productId ? { ...f, priceAtReturn: Number(price) } : f));
    };

    if (loading) return <div>Yükleniyor...</div>;
    if (!returnRequest) return <div>İade bulunamadı.</div>;

    const canUpdateStatus = user && ['admin', 'sevkiyat', 'muhasebe'].includes(user.role);
    const canProcessFinancials = user && ['admin', 'muhasebe'].includes(user.role) && returnRequest.status === 'Onaylandı';

    return (
        <div className="container mx-auto p-4">
            <button onClick={() => navigate('/admin/returns')} className="mb-4 text-blue-600 hover:underline">← İade Listesine Dön</button>
            <h1 className="text-2xl font-bold mb-4">İade Detayı #{returnRequest.returnNumber}</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Sol Taraf: İade Bilgileri ve Ürünler */}
                <div className="md:col-span-2 space-y-6">
                    {/* Müşteri ve Sipariş Bilgileri */}
                    <div className="bg-white p-4 shadow rounded-lg">
                        <h3 className="font-bold text-lg mb-2">Müşteri ve Sipariş Bilgileri</h3>
                        <p><strong>Müşteri:</strong> {returnRequest.customer.name} ({returnRequest.customer.companyName})</p>
                        <p><strong>Sipariş No:</strong> #{returnRequest.order.orderNumber}</p>
                        <p><strong>İade Tarihi:</strong> {new Date(returnRequest.createdAt).toLocaleString()}</p>
                        <p><strong>Durum:</strong> <span className="font-semibold">{returnRequest.status}</span></p>
                        <p><strong>Açıklama:</strong> {returnRequest.description}</p>
                    </div>

                    {/* İade Edilen Ürünler */}
                    <div className="bg-white p-4 shadow rounded-lg">
                        <h3 className="font-bold text-lg mb-2">İade Edilen Ürünler</h3>
                        {returnRequest.products.map(item => (
                            <div key={item.product._id} className="flex items-center justify-between border-b py-2">
                                <div>
                                    <p className="font-semibold">{item.product.name}</p>
                                    <p className="text-sm text-gray-500">Adet: {item.quantity}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Finansal İşlem (Sadece Muhasebe/Admin) */}
                    {canProcessFinancials && (
                        <div className="bg-white p-4 shadow rounded-lg">
                            <h3 className="font-bold text-lg mb-2">Finansal Onay ve Fiyatlandırma</h3>
                            <div className="space-y-2">
                                {financials.map(item => (
                                    <div key={item.productId} className="flex justify-between items-center">
                                        <span>{item.name} (Adet: {item.quantity})</span>
                                        <input type="number" value={item.priceAtReturn} onChange={e => handlePriceChange(item.productId, e.target.value)} className="p-1 border rounded w-24" placeholder="Birim Fiyat"/>
                                    </div>
                                ))}
                            </div>
                            <button onClick={handleFinancialProcess} className="mt-4 w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">Finansal İşlemi Tamamla ve Cariyi Güncelle</button>
                        </div>
                    )}
                </div>

                {/* Sağ Taraf: Durum Güncelleme ve Geçmiş */}
                <div className="space-y-6">
                    {/* Durum Güncelleme */}
                    {canUpdateStatus && !returnRequest.financial.isProcessed && (
                        <div className="bg-white p-4 shadow rounded-lg">
                            <h3 className="font-bold text-lg mb-2">Durumu Güncelle</h3>
                            <select value={status} onChange={e => setStatus(e.target.value)} className="w-full p-2 border rounded mb-2">
                                {/* Rol bazlı seçenekler eklenebilir */}
                                <option value="İade Talebi Oluşturuldu">İade Talebi Oluşturuldu</option>
                                <option value="İade Teslim Alındı">İade Teslim Alındı</option>
                                <option value="İncelemede">İncelemede</option>
                                <option value="Onaylandı">Onaylandı</option>
                                <option value="Kısmen Onaylandı">Kısmen Onaylandı</option>
                                <option value="Reddedildi">Reddedildi</option>
                            </select>
                            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Güncelleme notu (opsiyonel)" className="w-full p-2 border rounded mb-2" rows="3"></textarea>
                            <button onClick={handleStatusUpdate} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Güncelle</button>
                        </div>
                    )}

                    {/* İade Geçmişi */}
                    <div className="bg-white p-4 shadow rounded-lg">
                        <h3 className="font-bold text-lg mb-2">İade Geçmişi</h3>
                        <ul className="space-y-2">
                            {returnRequest.history.map((h, index) => (
                                <li key={index} className="border-l-4 pl-3">
                                    <p className="font-semibold">{h.status}</p>
                                    <p className="text-sm">İşlemi Yapan: {h.updatedBy?.name || 'Sistem'}</p>
                                    <p className="text-sm text-gray-500">Tarih: {new Date(h.updatedAt).toLocaleString()}</p>
                                    {h.notes && <p className="text-sm italic mt-1">Not: {h.notes}</p>}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReturnDetailPage;
