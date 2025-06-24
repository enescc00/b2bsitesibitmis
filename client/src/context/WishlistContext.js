import React, { createContext, useState, useEffect, useContext } from 'react';
import { AuthContext } from './AuthContext';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../config/api';

export const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
    const [wishlist, setWishlist] = useState([]);
    const { user, authToken } = useContext(AuthContext);

    const fetchWishlist = async () => {
        if (!authToken) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/users/wishlist`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            const data = await res.json();
            if (res.ok) setWishlist(data);
        } catch (error) { console.error("Favoriler alınamadı:", error); }
    };

    useEffect(() => {
        if (user) fetchWishlist();
        else setWishlist([]);
    }, [user, authToken]);

    const addToWishlist = async (productId) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/users/wishlist`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
                body: JSON.stringify({ productId })
            });
            const data = await res.json();
            if (res.ok) {
                toast.success('Ürün favorilere eklendi!');
                fetchWishlist();
            } else { throw new Error(data.msg); }
        } catch (error) { toast.error(error.message); }
    };

    const removeFromWishlist = async (productId) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/users/wishlist/${productId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            const data = await res.json();
            if (res.ok) {
                toast.info('Ürün favorilerden kaldırıldı.');
                fetchWishlist();
            } else { throw new Error(data.msg); }
        } catch (error) { toast.error(error.message); }
    };

    const isFavorited = (productId) => {
        return wishlist.some(item => item._id === productId);
    };

    return (
        <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist, isFavorited, fetchWishlist }}>
            {children}
        </WishlistContext.Provider>
    );
};