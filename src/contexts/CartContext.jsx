
"use client";

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';

const CartContext = createContext(undefined);

const CART_STORAGE_KEY = 'shopwave_cart';

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (storedCart) {
      try {
        setCartItems(JSON.parse(storedCart));
      } catch (error) {
        console.error("Failed to parse cart from localStorage", error);
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    }
  }, [cartItems, isLoaded]);

  const addToCart = useCallback((product) => {
    setCartItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(item => item.id === product.id);
      if (existingItemIndex > -1) {
        const itemName = product.type === 'pack' ? product.name : product.number;
        console.log(`${itemName} is already in the cart.`);
        return prevItems;
      } else {
        // For both individual numbers and packs, quantity is 1
        // The 'type' field from product (e.g., 'vipNumber' or 'pack') is now part of the product object
        return [...prevItems, { ...product, quantity: 1 }];
      }
    });
  }, []);


  const removeFromCart = useCallback((productId) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === productId ? { ...item, quantity: 1 } : item // Always set quantity to 1
      )
    );
  }, [removeFromCart]);


  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const getCartTotal = useCallback(() => {
    return cartItems.reduce((total, item) => {
      // Use packPrice for packs, price for individual numbers
      const price = item.type === 'pack' ? item.packPrice : item.price;
      return total + (price || 0); // Ensure price is a number
    }, 0);
  }, [cartItems]);

  const getItemCount = useCallback(() => {
      return cartItems.length;
    }, [cartItems]);


  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getItemCount,
  };

  if (!isLoaded) {
    return null;
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
