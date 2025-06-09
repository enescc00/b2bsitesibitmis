import React, { createContext, useState, useEffect } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  // Sayfa yüklendiğinde sepeti localStorage'dan al
  const [cartItems, setCartItems] = useState(() => {
    try {
      const localData = localStorage.getItem('cart');
      return localData ? JSON.parse(localData) : [];
    } catch (error) {
      console.error("Sepet verisi okunurken hata oluştu:", error);
      return [];
    }
  });

  // Sepet her değiştiğinde localStorage'ı güncelle
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product) => {
    setCartItems(prevItems => {
      const exist = prevItems.find(item => item._id === product._id);
      if (exist) {
        // Ürün zaten sepetteyse miktarını 1 artır
        return prevItems.map(item =>
          item._id === product._id ? { ...item, qty: item.qty + 1 } : item
        );
      } else {
        // Ürün sepette değilse miktarını 1 olarak ayarla ve ekle
        return [...prevItems, { ...product, qty: 1 }];
      }
    });
    // Kullanıcı deneyimi için bu uyarıyı daha sonra daha şık bir bildirimle değiştirebiliriz.
    alert(`${product.name} sepete eklendi!`);
  };

  const removeFromCart = (productId) => {
    setCartItems(prevItems => prevItems.filter(item => item._id !== productId));
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('cart'); // localStorage'ı da temizlemek iyi bir pratiktir
  };

  // Dışarıya açacağımız değerler ve fonksiyonlar
  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};