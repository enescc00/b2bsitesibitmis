import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import './AccountStatementPage.css'; // Kendi CSS dosyasını import ediyoruz

function AccountStatementPage() {
    const [statement, setStatement] = useState([]);
    const [loading, setLoading] = useState(true);
    const { authToken, user } = useContext(AuthContext);

    useEffect(() => {
        if (!authToken) return;

        const fetchStatement = async () => {
            setLoading(true);
            try {
                const response = await fetch('/api/users/profile/statement', {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.msg || 'Ekstre alınamadı.');
                setStatement(data);
            } catch (err) {
                toast.error(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchStatement();
    }, [authToken]);
    
    if (loading) return <div className="loading-container">Ekstre Yükleniyor...</div>;

    // Son bakiye hesapla: statement dizisinin son elemanındaki balance veya 0
const currentBalance = statement.length > 0 ? statement[statement.length - 1].balance : (user?.currentAccountBalance ?? 0);

    return (
        <div className="account-statement-page">
            <h3>Cari Hesap Ekstresi</h3>

            <div className="balance-summary">
                <h4>Güncel Bakiye</h4>
                <p className={currentBalance < 0 ? 'negative' : 'positive'}>
                    {Math.abs(currentBalance).toFixed(2)} ₺
                    <span>{currentBalance < 0 ? ' Borçlusunuz' : ' Alacaklısınız'}</span>
                </p>
            </div>
            
            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Tarih</th>
                            <th>Açıklama</th>
                            <th style={{textAlign: 'right'}}>Borç</th>
                            <th style={{textAlign: 'right'}}>Alacak</th>
                            <th style={{textAlign: 'right'}}>Bakiye</th>
                        </tr>
                    </thead>
                    <tbody>
                        {statement.length > 0 ? (
                            statement.map((item, index) => (
                                <tr key={index}>
                                    <td>{new Date(item.date).toLocaleDateString('tr-TR')}</td>
                                    <td>{item.description}</td>
                                    <td style={{textAlign: 'right'}} className="debt">
                                        {item.amount < 0 ? `${Math.abs(item.amount).toFixed(2)} ₺` : '-'}
                                    </td>
                                    <td style={{textAlign: 'right'}} className="credit">
                                        {item.amount > 0 ? `${item.amount.toFixed(2)} ₺` : '-'}
                                    </td>
                                    <td style={{textAlign: 'right', fontWeight: 'bold'}}>
                                        {item.balance.toFixed(2)} ₺
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" style={{textAlign: 'center', padding: '2rem'}}>
                                    Görüntülenecek cari hesap hareketi bulunmamaktadır.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default AccountStatementPage;