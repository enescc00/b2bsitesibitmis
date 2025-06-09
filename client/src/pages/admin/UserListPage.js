import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import './AdminTable.css';

function UserListPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { authToken } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5001/api/users', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.msg || 'Müşteriler getirilemedi.');
        }
        setUsers(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (authToken) {
      fetchUsers();
    }
  }, [authToken]);

  const handleRowClick = (id) => {
    navigate(`/admin/user/${id}`);
  };

  if (loading) return <div>Yükleniyor...</div>;
  if (error) return <div>Hata: {error}</div>;

  return (
    <div className="admin-page-container">
      <h1>Müşteri Yönetimi</h1>
      <p>Sisteme kayıtlı toplam {users.length} müşteri bulunmaktadır.</p>
      
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Ad / Unvan</th>
              <th>Email</th>
              <th>Müşteri Tipi</th>
              <th>Cari Bakiye</th>
              <th>Kayıt Tarihi</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id} onClick={() => handleRowClick(user._id)} className="clickable-row">
                <td>{user.companyTitle || user.name}</td>
                <td>{user.email}</td>
                <td>{user.__t === 'CorporateUser' ? 'Kurumsal' : 'Bireysel'}</td>
                <td>{user.currentAccountBalance.toFixed(2)} ₺</td>
                <td>{new Date(user.createdAt).toLocaleDateString('tr-TR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UserListPage;