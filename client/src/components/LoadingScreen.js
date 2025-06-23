import React from 'react';
import './LoadingScreen.css';

const LoadingScreen = () => {
    return (
        <div className="loading-screen">
            <div className="loading-content">
                <div className="loading-spinner"></div>
                <h2>Uygulama Yükleniyor...</h2>
                <p>Lütfen bekleyin...</p>
            </div>
        </div>
    );
};

export default LoadingScreen;
