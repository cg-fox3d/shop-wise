
"use client";

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { 
  getAuth, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  updateProfile,
  sendEmailVerification
} from 'firebase/auth';
import { firebaseApp, db } from '@/lib/firebase'; // Assuming firebase config is here
import { doc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast"; // Import useToast

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); 
  const auth = getAuth(firebaseApp);
  const { toast } = useToast(); // Initialize toast

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // If user exists, check if their Firestore doc has isVerified flag,
        // and if emailVerified from auth is true, then sync it.
        // This is a secondary check; primary check is during login.
        if (currentUser.emailVerified) {
          const userDocRef = doc(db, "users", currentUser.uid);
          try {
            await updateDoc(userDocRef, { isVerified: true });
          } catch (error) {
            // It's okay if the doc doesn't exist yet, will be created on login/signup.
            // console.warn("Could not update isVerified flag on auth state change:", error.message);
          }
        }
      }
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [auth]);

  const login = useCallback(async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    if (userCredential.user) {
      if (!userCredential.user.emailVerified) {
        await signOut(auth); // Sign out user if email is not verified
        toast({
          title: "Email Verification Required",
          description: "Please verify your email address before logging in. Check your inbox for a verification link.",
          variant: "destructive",
          duration: 7000,
        });
        throw new Error("Email not verified."); // Throw error to stop further login process in modal
      }
      // Email is verified, proceed to update lastLogin
      const userDocRef = doc(db, "users", userCredential.user.uid);
      try {
        await updateDoc(userDocRef, {
          lastLogin: serverTimestamp(),
          isVerified: true // Ensure isVerified is true
        });
         // Assuming LoginModal calls onLoginSuccess from its own context or props
        // For example, if LoginModal is passed an onLoginSuccess prop:
        // if (typeof onLoginSuccess === 'function') onLoginSuccess();
        // For now, a generic success toast.
        toast({ title: "Login Successful" });

      } catch (error) {
        console.error("Error updating lastLogin or isVerified:", error);
        // Still proceed with login, but log the error
        toast({ title: "Login Successful (with minor issue updating details)" });
      }
    }
    return userCredential;
  }, [auth, toast]);

  const signup = useCallback(async (email, password, name, phoneNumber) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    if (firebaseUser) {
      // Update Firebase Auth profile
      await updateProfile(firebaseUser, { displayName: name });

      // Send email verification
      await sendEmailVerification(firebaseUser);
      toast({
        title: "Verification Email Sent",
        description: "Please check your email to verify your account before logging in.",
        duration: 7000,
      });
      
      // Store user details in Firestore
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const now = serverTimestamp();
      await setDoc(userDocRef, {
        uid: firebaseUser.uid,
        name: name,
        email: firebaseUser.email,
        phoneNumber: phoneNumber,
        isVerified: false, // Initially false
        createdAt: now,
        registeredOn: now, // Can be same as createdAt or a specific registration event timestamp
        lastLogin: null, // No last login yet
      });
      
      // Sign out the user immediately after signup, forcing them to verify
      await signOut(auth);
    }
    return userCredential;
  }, [auth, toast]);

  const logout = useCallback(async () => {
    await signOut(auth);
    // Toast for logout success is usually handled where logout is called.
  }, [auth]);

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
  };

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
