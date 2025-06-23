import React, { useContext } from 'react';
import { WishlistContext } from '../../context/WishlistContext';
import ProductCard from '../../components/ProductCard';
import EmptyState from '../../components/ui/EmptyState';
import '../ProductsPage.css'; // ProductsPage stilini kullanabiliriz

function WishlistPage() {
    const { wishlist } = useContext(WishlistContext);

    return (
        <div className="products-page">
            <h1>Favorilerim</h1>
            {wishlist.length === 0 ? (
                <EmptyState 
                    message="Favori listeniz boş."
                    link="/products"
                    linkText="Hemen Alışverişe Başlayın"
                />
            ) : (
                <div className="products-grid">
                    {wishlist.map(product => (
                        <ProductCard key={product._id} product={product} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default WishlistPage;