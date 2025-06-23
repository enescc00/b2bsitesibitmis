import React, { useState, useEffect, useContext } from 'react';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import './SalesRepDashboardPage.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

// StatCard bileşeni, ana paneldeki istatistik kartlarını oluşturur.
function StatCard({ title, value, iconClass }) {
  return (
    <div className="stat-card">
      <div className="stat-card-icon">
        <i className={iconClass}></i>
      </div>
      <div className="stat-card-info">
        <h4>{title}</h4>
        <p>{value}</p>
      </div>
    </div>
  );
}

// Ana Dashboard Bileşeni
function SalesRepDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { authToken } = useContext(AuthContext);
  const [period, setPeriod] = useState('monthly'); // 'daily', 'monthly', 'yearly'

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!authToken) return;
      
      setLoading(true);
      try {
        const response = await fetch(`/api/salesrep/dashboard-stats?period=${period}`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.msg || 'Panel verileri alınamadı.');
        }
        setStats(data);
      } catch (err) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [authToken, period]);

  const { 
    dailySalesChartData, 
    monthlyPaymentsChartData 
  } = React.useMemo(() => {
    if (!stats) return { dailySalesChartData: null, monthlyPaymentsChartData: null };

    // Daily Sales Chart
    const dailyLabels = [];
    const dailyData = [];
    const today = new Date();
    for (let i = 14; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      dailyLabels.push(date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }));
      const dayData = stats.dailySalesData.find(d => d._id === dateString);
      dailyData.push(dayData ? dayData.totalSales : 0);
    }
    const processedDailySales = {
      labels: dailyLabels,
      datasets: [{
        label: 'Günlük Satış',
        data: dailyData,
        backgroundColor: 'rgba(231, 76, 60, 0.8)',
        borderColor: 'rgba(231, 76, 60, 1)',
        borderWidth: 1
      }],
    };

    // Monthly Payments Chart
    const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    const paymentMethods = [...new Set(stats.monthlyPaymentData.map(d => d.paymentMethod))];
    const backgroundColors = ['#36A2EB', '#FF6384', '#4BC0C0', '#FFCE56', '#9966FF', '#E7E9ED', '#F7464A'];
    const processedMonthlyPayments = {
      labels: monthNames,
      datasets: paymentMethods.map((method, index) => {
        const data = Array(12).fill(0);
        stats.monthlyPaymentData
          .filter(d => d.paymentMethod === method)
          .forEach(d => {
            if (d.month >= 1 && d.month <= 12) {
              data[d.month - 1] += d.total;
            }
          });
        return {
          label: method,
          data: data,
          backgroundColor: backgroundColors[index % backgroundColors.length],
        };
      }),
    };

    return { 
      dailySalesChartData: processedDailySales, 
      monthlyPaymentsChartData: processedMonthlyPayments 
    };
  }, [stats]);

  const barChartOptions = {
    responsive: true,
    plugins: { legend: { display: false }, title: { display: false } },
    scales: { y: { beginAtZero: true } }
  };

  const stackedBarChartOptions = {
    responsive: true,
    plugins: { legend: { position: 'top' }, title: { display: false } },
    scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } },
  };

  if (loading) {
    return <div className="loading-container">Ana Panel Yükleniyor...</div>;
  }

  if (error) {
    return <div className="error-container">Hata: {error}</div>;
  }

  return (
    <div className="sales-rep-dashboard">
      <div className="dashboard-header">
        <h1>Ana Panel</h1>
        <div className="period-selector">
          <button onClick={() => setPeriod('daily')} className={period === 'daily' ? 'active' : ''}>Günlük</button>
          <button onClick={() => setPeriod('monthly')} className={period === 'monthly' ? 'active' : ''}>Aylık</button>
          <button onClick={() => setPeriod('yearly')} className={period === 'yearly' ? 'active' : ''}>Yıllık</button>
        </div>
      </div>
      
      {stats && (
        <>
          <div className="stats-grid">
            <StatCard 
              title="Dönem Satışı" 
              value={`${stats.periodSales.toFixed(2)} ₺`} 
              iconClass="fas fa-dollar-sign" 
            />
            <StatCard 
              title="Dönem Siparişi" 
              value={stats.periodOrderCount} 
              iconClass="fas fa-shopping-cart" 
            />
            <StatCard 
              title="Dönem Tahsilatı" 
              value={`${stats.periodCollections.toFixed(2)} ₺`} 
              iconClass="fas fa-cash-register" 
            />
            <StatCard 
              title="Toplam Müşteri" 
              value={stats.totalCustomers} 
              iconClass="fas fa-users" 
            />
            <StatCard 
              title="Kasa Bakiyesi" 
              value={`${stats.cashboxBalance.toFixed(2)} ₺`} 
              iconClass="fas fa-wallet" 
            />
          </div>

          <div className="dashboard-grid-large">
            <div className="chart-container-wrapper">
              <h3>Günlük Bazda İşlem Toplamı</h3>
              {dailySalesChartData && stats.dailySalesData.length > 0 ? (
                <Bar options={barChartOptions} data={dailySalesChartData} />
              ) : (
                <div className="no-data-placeholder">
                  <i className="fas fa-chart-bar"></i>
                  <p>Veri bulunamadı.</p>
                </div>
              )}
            </div>
            <div className="chart-container-wrapper">
              <h3>Aylık Toplam Ödeme Tutarları</h3>
              {monthlyPaymentsChartData && stats.monthlyPaymentData.length > 0 ? (
                <Bar options={stackedBarChartOptions} data={monthlyPaymentsChartData} />
              ) : (
                <div className="no-data-placeholder">
                  <i className="fas fa-chart-bar"></i>
                  <p>Veri bulunamadı.</p>
                </div>
              )}
            </div>
          </div>

          <div className="dashboard-grid-bottom">
            <div className="chart-container-wrapper">
              <h2>Ödeme Yöntemi Dağılımı</h2>
              <div className="doughnut-container">
                {stats.paymentMethodStats.length > 0 ? (
                  <Doughnut data={{
                    labels: stats.paymentMethodStats.map(p => p._id),
                    datasets: [{
                      data: stats.paymentMethodStats.map(p => p.total),
                      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
                    }]
                  }} />
                ) : (
                  <div className="no-data-placeholder">
                    <i className="fas fa-chart-pie"></i>
                    <p>Veri bulunamadı.</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="recent-activity-container">
              <h2>Son Kasa Hareketleri</h2>
              <ul className="activity-list">
                {stats.recentTransactions.length > 0 ? (
                  stats.recentTransactions.map(tx => (
                    <li key={tx._id} className="activity-item">
                      <span className="activity-description">
                        {tx.description}
                        {tx.customer && <span className="customer-name"> ({tx.customer.name})</span>}
                      </span>
                      <span className={`activity-amount ${tx.type}`}>
                        {tx.type === 'income' ? '+' : '-'}{tx.amount.toFixed(2)} ₺
                      </span>
                    </li>
                  ))
                ) : (
                  <p>Henüz bir kasa hareketi yok.</p>
                )}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default SalesRepDashboardPage;