import React from 'react';
import './MaintenancePage.css';

const MaintenancePage = ({ message }) => {
  return (
    <div className="maintenance-container">
      <div className="maintenance-icon">🚧</div>
      <h1>Sitemiz Şu Anda Bakımda</h1>
      <p>
        {message || 'Daha iyi bir hizmet sunabilmek için kısa bir süreliğine bakımdayız. Anlayışınız için teşekkür ederiz.'}
      </p>
    </div>
  );
};

export default MaintenancePage;
