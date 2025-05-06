"use client";

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase'; // Assuming firebase config is here

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Start loading until auth state is confirmed
  const auth = getAuth(firebaseApp);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false); // Auth state confirmed, stop loading
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [auth]);

  const login = useCallback((email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  }, [auth]);

  const signup = useCallback((email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  }, [auth]);

  const logout = useCallback(() => {
    return signOut(auth);
  }, [auth]);

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
  };

  // Don't render children until loading is false to prevent flash of unauthenticated content
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
