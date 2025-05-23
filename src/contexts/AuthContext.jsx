
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
  getIdToken // Added getIdToken
} from 'firebase/auth';
import { firebaseApp, db } from '@/lib/firebase';
// Firestore direct writes are removed as per new requirement for backend functions
// import { doc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore'; 
import { useToast } from "@/hooks/use-toast";

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); 
  const auth = getAuth(firebaseApp);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // Basic user object update, backend handles Firestore doc updates
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
      
      // Call backend to update lastLogin
      try {
        const idToken = await getIdToken(userCredential.user);
        const response = await fetch('https://numbersguru.com/.netlify/functions/update-user-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({ uid: userCredential.user.uid }) // Send UID for explicitness
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update user login time via backend.');
        }
        // console.log("User login time updated via backend successfully.");
        toast({ title: "Login Successful" });
      } catch (backendError) {
        console.error("Error calling backend to update user login:", backendError);
        toast({ 
          title: "Login Partially Successful", 
          description: "Could not update login time. Please contact support if issues persist.",
          variant: "destructive"
        });
        // Proceed with login even if backend update fails for now
      }
    }
    return userCredential;
  }, [auth, toast]);

  const signup = useCallback(async (email, password, name, phoneNumber) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    if (firebaseUser) {
      await updateProfile(firebaseUser, { displayName: name });

      // Call backend to save user details
      let backendUserSaved = false;
      try {
        const idToken = await getIdToken(firebaseUser);
        const response = await fetch('https://numbersguru.com/.netlify/functions/save-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({ 
            uid: firebaseUser.uid, 
            email: firebaseUser.email, 
            name, 
            phoneNumber 
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Backend user creation failed');
        }
        // console.log("Backend user creation/save initiated successfully.");
        backendUserSaved = true;
      } catch (backendError) {
        console.error("Error calling backend to save user:", backendError);
        toast({
          title: "Signup Incomplete",
          description: `Account creation failed during data save: ${backendError.message}. Please try again.`,
          variant: "destructive",
          duration: 7000,
        });
        // Optionally, delete the Firebase Auth user if backend save fails critically
        // await firebaseUser.delete(); 
        // For now, we'll proceed to send verification email but warn user.
      }
      
      await sendEmailVerification(firebaseUser);
      
      if (backendUserSaved) {
        toast({
          title: "Verification Email Sent",
          description: "Please check your email to verify your account. After verification, your account details will be fully set up.",
          duration: 7000,
        });
      } else {
         toast({
          title: "Verification Email Sent (Action Required)",
          description: "Verification email sent, but there was an issue saving your details. Please contact support if login issues persist after verification.",
          variant: "destructive",
          duration: 10000,
        });
      }
      
      await signOut(auth); // Sign out the user immediately after signup, forcing them to verify
    }
    return userCredential;
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
