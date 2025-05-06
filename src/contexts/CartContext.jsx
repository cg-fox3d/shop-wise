"use client";

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';

const CartContext = createContext(undefined);

const CART_STORAGE_KEY = 'shopwave_cart';

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false); // To prevent hydration issues

  // Load cart from localStorage on initial client render
  useEffect(() => {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (storedCart) {
      try {
        setCartItems(JSON.parse(storedCart));
      } catch (error) {
        console.error("Failed to parse cart from localStorage", error);
        localStorage.removeItem(CART_STORAGE_KEY); // Clear corrupted data
      }
    }
    setIsLoaded(true);
  }, []);

  // Save cart to localStorage whenever it changes (only on client)
  useEffect(() => {
    if (isLoaded) { // Only save after initial load
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    }
  }, [cartItems, isLoaded]);

  const addToCart = useCallback((product) => {
    setCartItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(item => item.id === product.id);
      if (existingItemIndex > -1) {
        // Item already exists, do not add again (or maybe show a message)
        console.log(`${product.name} is already in the cart.`);
        return prevItems; // Return previous items unchanged
      } else {
        // Add the new item with quantity 1
        return [...prevItems, { ...product, quantity: 1 }];
      }
    });
  }, []);


  const removeFromCart = useCallback((productId) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  }, []);

  // Update quantity - Keep quantity always 1 if item exists, or remove if <= 0
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
    // Since quantity is always 1, total is just the sum of prices
    return cartItems.reduce((total, item) => total + item.price, 0);
  }, [cartItems]);

  const getItemCount = useCallback(() => {
      // Item count is simply the number of unique items in the cart
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

  // Render children only after loading state from localStorage
  if (!isLoaded) {
    return null; // Or a loading indicator if preferred
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
