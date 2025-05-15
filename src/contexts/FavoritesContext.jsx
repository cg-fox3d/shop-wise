
"use client";

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';

const FavoritesContext = createContext(undefined);

const FAVORITES_STORAGE_KEY = 'shopwave_favorites';

export const FavoritesProvider = ({ children }) => {
  const [favoriteItems, setFavoriteItems] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const storedFavorites = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (storedFavorites) {
      try {
        setFavoriteItems(JSON.parse(storedFavorites));
      } catch (error) {
        console.error("Failed to parse favorites from localStorage", error);
        localStorage.removeItem(FAVORITES_STORAGE_KEY);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteItems));
    }
  }, [favoriteItems, isLoaded]);

  const addToFavorites = useCallback((product) => {
    setFavoriteItems(prevItems => {
      if (prevItems.find(item => item.id === product.id)) {
        return prevItems; 
      }
      // Product object (VIP number or Pack) already contains its type
      return [...prevItems, product]; 
    });
  }, []);

  const removeFromFavorites = useCallback((productId) => {
    setFavoriteItems(prevItems => prevItems.filter(item => item.id !== productId));
  }, []);

  const isFavorite = useCallback((productId) => {
    return favoriteItems.some(item => item.id === productId);
  }, [favoriteItems]);

  const getFavoritesCount = useCallback(() => {
    return favoriteItems.length;
  }, [favoriteItems]);

  const toggleFavorite = useCallback((product) => {
    if (isFavorite(product.id)) {
      removeFromFavorites(product.id);
    } else {
      addToFavorites(product);
    }
  }, [addToFavorites, removeFromFavorites, isFavorite]);

  const value = {
    favoriteItems,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    getFavoritesCount,
    toggleFavorite,
  };

  if (!isLoaded) {
    return null; 
  }

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
