import React, { useState, useEffect, useMemo, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import './CashboxPage.css'; // Yeni CSS dosyamızı import ediyoruz

function CashboxPage() {
    // === STATE'LER ===
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    // Yeni masraf formu için state'ler
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');

    const { authToken } = useContext(AuthContext);

    // Kasa hareketlerini getiren fonksiyon
    const fetchTransactions = async () => {
        if (!authToken) return;
        setLoading(true);
        try {
            const response = await fetch('/api/salesrep/my-cashbox', {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.msg || 'Kasa hareketleri alınamadı.');
            setTransactions(data);
        } catch (err) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Component ilk yüklendiğinde verileri çek
    useEffect(() => {
        fetchTransactions();
    }, [authToken]);
    
    // === HESAPLAMALAR ===
    // `useMemo` kullanarak, transactions listesi değişmediği sürece yeniden hesaplama yapılmasını önlüyoruz.
    const totals = useMemo(() => {
        const totalIncome = transactions
            .filter(t => t.type === 'income')
            .reduce((acc, t) => acc + t.amount, 0);

        const totalExpense = transactions
            .filter(t => t.type === 'expense')
            .reduce((acc, t) => acc + t.amount, 0);

        const balance = totalIncome - totalExpense;

        return { totalIncome, totalExpense, balance };
    }, [transactions]);


    // === FORM İŞLEMLERİ ===
    const handleExpenseSubmit = async (e) => {
        e.preventDefault();
        if (!amount || !description) {
            return toast.error('Lütfen tüm alanları doldurun.');
        }

        try {
            const response = await fetch('/api/salesrep/log-expense', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
                body: JSON.stringify({ amount: parseFloat(amount), description })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.msg || 'Masraf kaydedilemedi.');

            toast.success('Masraf başarıyla kaydedildi.');
            setAmount('');
            setDescription('');
            fetchTransactions(); // Listeyi ve bakiyeyi güncelle
        } catch (err) {
            toast.error(err.message);
        }
    };


    if (loading) return <div className="loading-container">Kasa Hareketleri Yükleniyor...</div>;
    if (error) return <div className="error-container">Hata: {error}</div>;

    return (
        <div className="cashbox-page">
            <h1>Kasa Hareketleri</h1>
            <div className="cashbox-summary-grid">
                <div className="summary-card income-card">
                    <h4>Toplam Gelir (Tahsilat)</h4>
                    <p>{totals.totalIncome.toFixed(2)} ₺</p>
                </div>
                <div className="summary-card expense-card">
                    <h4>Toplam Gider (Masraf)</h4>
                    <p>{totals.totalExpense.toFixed(2)} ₺</p>
                </div>
                <div className="summary-card balance-card">
                    <h4>Kasa Bakiyesi</h4>
                    <p>{totals.balance.toFixed(2)} ₺</p>
                </div>
            </div>

            <div className="cashbox-main-content">
                <div className="transaction-list-container">
                    <h2>İşlem Geçmişi</h2>
                    <table className="transaction-table">
                        <thead>
                            <tr>
                                <th>Tarih</th>
                                <th>Tip</th>
                                <th>Açıklama / Müşteri</th>
                                <th style={{textAlign: 'right'}}>Tutar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.length > 0 ? (
                                transactions.map(tx => (
                                    <tr key={tx._id}>
                                        <td>{new Date(tx.date).toLocaleDateString('tr-TR')}</td>
                                        <td>
                                            <span className={`transaction-amount ${tx.type}`}>
                                                {tx.type === 'income' ? 'Gelir' : 'Gider'}
                                            </span>
                                        </td>
                                        <td>{tx.description}</td>
                                        <td className={`transaction-amount ${tx.type}`} style={{textAlign: 'right'}}>
                                            {tx.type === 'income' ? '+' : '-'}{tx.amount.toFixed(2)} ₺
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="4" style={{textAlign: 'center'}}>Kayıt bulunamadı.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="expense-form-container">
                    <h2>Yeni Masraf Girişi</h2>
                    <form onSubmit={handleExpenseSubmit} className="payment-form">
                         <div className="form-group">
                            <label htmlFor="amount">Tutar (₺)</label>
                            <input 
                              type="number" 
                              id="amount" 
                              value={amount} 
                              onChange={(e) => setAmount(e.target.value)}
                              placeholder="0.00"
                              step="0.01"
                              required 
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="description">Masraf Açıklaması</label>
                            <textarea 
                              id="description" 
                              rows="3"
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                              placeholder="Örn: Yakıt Gideri"
                              required
                            ></textarea>
                        </div>
                        <button type="submit" className="submit-btn">Masrafı Kaydet</button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default CashboxPage;