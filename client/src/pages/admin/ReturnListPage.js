import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiRequest from '../../utils/apiHelper';
import { toast } from 'react-toastify';

const ReturnListPage = () => {
    const [returns, setReturns] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReturns = async () => {
            try {
                const data = await apiRequest('/returns').then(r=>r.json());
                setReturns(data);
            } catch (error) {
                toast.error('İadeler getirilirken bir hata oluştu.');
            } finally {
                setLoading(false);
            }
        };
        fetchReturns();
    }, []);

    if (loading) {
        return <div>Yükleniyor...</div>;
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">İade Yönetimi</h1>
            <div className="bg-white shadow-md rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İade No</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Müşteri</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlem</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {returns.length > 0 ? returns.map(ret => (
                            <tr key={ret._id}>
                                <td className="px-6 py-4 whitespace-nowrap">{ret.returnNumber}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{ret.customer?.name || 'Bilinmiyor'}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{new Date(ret.createdAt).toLocaleDateString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800`}>
                                        {ret.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <Link to={`/admin/return/${ret._id}`} className="text-indigo-600 hover:text-indigo-900">Detay</Link>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="5" className="px-6 py-4 text-center">Aktif iade talebi bulunmuyor.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ReturnListPage;
