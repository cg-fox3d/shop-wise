
"use client";

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { 
  getAuth, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  updateProfile,
  sendEmailVerification,
  getIdToken
} from 'firebase/auth';
import { firebaseApp, db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); 
  const auth = getAuth(firebaseApp);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        if (currentUser.emailVerified) {
          const userDocRef = doc(db, "users", currentUser.uid);
          try {
            // This update is optimistic. If the doc doesn't exist, it won't create it.
            // The backend function should be the primary source for creating the user doc.
            await updateDoc(userDocRef, { isVerified: true, lastLogin: serverTimestamp() });
          } catch (error) {
            // console.warn("Could not update isVerified/lastLogin on auth state change (doc might not exist yet):", error.message);
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
        await signOut(auth); 
        toast({
          title: "Email Verification Required",
          description: "Please verify your email address before logging in. Check your inbox for a verification link.",
          variant: "destructive",
          duration: 7000,
        });
        throw new Error("Email not verified.");
      }
      
      const userDocRef = doc(db, "users", userCredential.user.uid);
      try {
        await updateDoc(userDocRef, {
          lastLogin: serverTimestamp(),
          isVerified: true 
        });
        toast({ title: "Login Successful" });
      } catch (error) {
        console.error("Error updating lastLogin or isVerified:", error);
        // If the document doesn't exist here, it means the backend function might not have created it yet.
        // This is a potential issue to handle based on your backend implementation.
        toast({ title: "Login Successful (Note: User details might still be syncing)" });
      }
    }
    return userCredential;
  }, [auth, toast]);

  const signup = useCallback(async (email, password, name, phoneNumber) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    if (firebaseUser) {
      await updateProfile(firebaseUser, { displayName: name });
      await sendEmailVerification(firebaseUser);
      
      toast({
        title: "Verification Email Sent",
        description: "Please check your email to verify your account. After verification, your account details will be fully set up.",
        duration: 7000,
      });

      // IMPORTANT: Backend User Creation Step
      // The user document in Firestore (with uid, name, email, phoneNumber, isVerified: false, 
      // createdAt, registeredOn, role: "customer") should now be created by a backend function.
      // You would typically call your backend function here, passing the firebaseUser.uid or ID token, 
      // name, and phoneNumber.
      // Example (conceptual):
      /*
      try {
        const idToken = await getIdToken(firebaseUser);
        const response = await fetch('/api/create-user', { // Your backend endpoint
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({ name, phoneNumber, email: firebaseUser.email, uid: firebaseUser.uid })
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Backend user creation failed');
        }
        console.log("Backend user creation initiated successfully.");
      } catch (backendError) {
        console.error("Error calling backend to create user:", backendError);
        // Handle this error appropriately - maybe log it, inform the user,
        // or queue the user creation for a retry.
        // For now, we'll proceed with signing out the user as email verification is key.
      }
      */
      
      await signOut(auth); // Sign out the user immediately after signup, forcing them to verify
    }
    return userCredential; // Return the original credential for potential further frontend use if needed
  }, [auth, toast]);

  const logout = useCallback(async () => {
    await signOut(auth);
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
