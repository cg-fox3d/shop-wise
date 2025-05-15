
"use client";

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';

const CartContext = createContext(undefined);

const CART_STORAGE_KEY = 'shopwave_cart';

// Helper to generate a unique ID for cart items based on pack ID and selected numbers
const generateCartItemId = (item) => {
  if (item.type === 'pack' && item.selectedNumbers && item.selectedNumbers.length > 0) {
    const selectedIdsString = item.selectedNumbers.map(n => n.id).sort().join(',');
    return `${item.id}-${selectedIdsString}`;
  }
  return item.id;
};


export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (storedCart) {
      try {
        const parsedCart = JSON.parse(storedCart);
        // Ensure all items have a cartId
        const validatedCart = parsedCart.map(item => ({
          ...item,
          cartId: item.cartId || generateCartItemId(item)
        }));
        setCartItems(validatedCart);
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
      const cartId = generateCartItemId(product);
      const existingItemIndex = prevItems.findIndex(item => item.cartId === cartId);

      if (existingItemIndex > -1) {
        // Item (or specific pack selection) already in cart, perhaps update quantity or do nothing
        // For now, we just log and don't add again if it's the exact same selection
        console.log(`${product.name} (selection) is already in the cart.`);
        return prevItems;
      } else {
        // For 'pack' type, product.price is the dynamically calculated price of selectedNumbers
        // For 'vipNumber', product.price is its own price
        // Add type and cartId for robust identification
        const newItem = { 
          ...product, 
          quantity: 1, 
          cartId: cartId, // Unique ID for this specific cart entry
          // Ensure 'type' is present, 'price' is the calculated one for packs
          type: product.type || (product.selectedNumbers ? 'pack' : 'vipNumber'),
          price: product.price 
        };
        return [...prevItems, newItem];
      }
    });
  }, []);


  const removeFromCart = useCallback((cartIdToRemove) => {
    setCartItems(prevItems => prevItems.filter(item => item.cartId !== cartIdToRemove));
  }, []);

  // Quantity update for packs with specific selections might mean just 1 or remove.
  // For simplicity, quantity is always 1 for packs.
  const updateQuantity = useCallback((cartIdToUpdate, quantity) => {
    if (quantity <= 0) {
      removeFromCart(cartIdToUpdate);
      return;
    }
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.cartId === cartIdToUpdate ? { ...item, quantity: item.type === 'pack' ? 1 : quantity } : item
      )
    );
  }, [removeFromCart]);


  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const getCartTotal = useCallback(() => {
    return cartItems.reduce((total, item) => {
      // item.price for packs is already the sum of selected numbers
      // item.price for vipNumber is its own price
      return total + (item.price || 0) * (item.quantity || 1);
    }, 0);
  }, [cartItems]);

  const getItemCount = useCallback(() => {
      return cartItems.reduce((count, item) => count + (item.quantity || 1), 0);
    }, [cartItems]);


  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getItemCount,
    generateCartItemId, // Expose for potential use elsewhere if needed
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
