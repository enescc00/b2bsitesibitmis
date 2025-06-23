import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import Paginate from '../../components/Paginate';
import { toast } from 'react-toastify';
import './AdminTable.css';

function UserListPage() {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [keyword, setKeyword] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const { authToken } = useContext(AuthContext);
  const navigate = useNavigate();
  const { pageNumber } = useParams();
  const currentPage = pageNumber || 1;

  useEffect(() => {
    const timer = setTimeout(() => {
        setKeyword(searchTerm);
        if (searchTerm) navigate('/admin/users/page/1');
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, navigate]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/users/admin?keyword=${keyword}&pageNumber=${currentPage}`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.msg || 'Müşteriler getirilemedi.');
        setUsers(data.users);
        setPage(data.page);
        setPages(data.pages);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (authToken) fetchUsers();
  }, [authToken, currentPage, keyword]);

  const handleRowClick = (id) => {
    navigate(`/admin/user/${id}/edit`);
  };

  const handleApprove = async (e, userId) => {
    e.stopPropagation(); // Satırın genel tıklama olayını engelle
    if (window.confirm('Bu kullanıcıyı onaylamak istediğinizden emin misiniz?')) {
        try {
            console.log('Onaylama isteği gönderiliyor...', userId);
            const response = await fetch(`/api/users/admin/${userId}/approve`, {
                method: 'PUT',
                headers: { 
                  'Authorization': `Bearer ${authToken}`,
                  'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            console.log('Sunucu yanıtı:', data);
            
            if(!response.ok) {
              throw new Error(data.msg || 'Onaylama işlemi başarısız.');
            }
            
            // Kullanıcı listesini güncelle
            setUsers(users.map(u => u._id === userId ? { ...u, isApproved: true } : u));
            toast.success('Kullanıcı başarıyla onaylandı!');
        } catch (err) {
            console.error('Onaylama hatası:', err);
            toast.error(`Hata: ${err.message}`);
        }
    }
  };

  if (loading) return <div className="loading-container">Yükleniyor...</div>;
  if (error) return <div className="error-container">Hata: {error}</div>;

  return (
    <div className="admin-page-container">
      <h1>Müşteri Yönetimi</h1>
      <div className="search-form">
        <input 
            type="text" placeholder="İsim, email veya firma ara..." 
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
        />
      </div>
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Ad / Unvan</th>
              <th>Email</th>
              <th>Müşteri Tipi</th>
              <th>Onay Durumu</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id} onClick={() => handleRowClick(user._id)} className="clickable-row">
                <td>{user.companyTitle || user.name}</td>
                <td>{user.email}</td>
                <td>{user.__t === 'CorporateUser' ? 'Kurumsal' : 'Bireysel'}</td>
                <td>
                  {user.isApproved ? 
                    <span className="status-approved">Onaylandı</span> : 
                    <span className="status-pending">Onay Bekliyor</span>
                  }
                </td>
                <td onClick={(e) => e.stopPropagation()}>
                    {!user.isApproved && (
                        <button onClick={(e) => handleApprove(e, user._id)} className="approve-btn">Onayla</button>
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Paginate pages={pages} page={page} isAdmin={true} baseUrl='/admin/users' />
    </div>
  );
}

export default UserListPage;