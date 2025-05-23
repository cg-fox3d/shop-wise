
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
      
      try {
        const idToken = await getIdToken(userCredential.user);
        const response = await fetch('https://numbers-guru.netlify.app/.netlify/functions/update-user-login', { // Corrected URL
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({ uid: userCredential.user.uid }) 
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response from update-user-login' }));
          console.error("Backend error (update-user-login):", errorData);
          throw new Error(errorData.message || 'Failed to update user login time via backend.');
        }
        // console.log("User login time updated via backend successfully.");
        toast({ title: "Login Successful" });
      } catch (backendError) {
        console.error("Error calling backend to update user login:", backendError);
        toast({ 
          title: "Login Partially Successful", 
          description: `Could not update login time: ${backendError.message}. Please contact support if issues persist.`,
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

      let backendUserSaved = false;
      try {
        const idToken = await getIdToken(firebaseUser);
        const response = await fetch('https://numbers-guru.netlify.app/.netlify/functions/save-user', { // Corrected URL
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({ 
            uid: firebaseUser.uid, 
            email: firebaseUser.email, 
            name: firebaseUser.displayName, // Use displayName after updateProfile
            phoneNumber,
            // role: 'customer' // Your backend will handle setting the role
            // isVerified: false // Your backend will handle setting this
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response from save-user' }));
          console.error("Backend error (save-user):", errorData);
          throw new Error(errorData.message || 'Backend user creation/save failed');
        }
        // console.log("Backend user creation/save initiated successfully.");
        backendUserSaved = true;
      } catch (backendError) {
        console.error("Error calling backend to save user:", backendError);
        // Even if backend call fails, we proceed to send verification email and sign out.
        // The user is informed via toast.
      }
      
      try {
        await sendEmailVerification(firebaseUser);
        if (backendUserSaved) {
            toast({
              title: "Verification Email Sent",
              description: "Please check your email to verify your account.",
              duration: 7000,
            });
        } else {
            toast({
                title: "Verification Email Sent (Action Required)",
                description: "Verification email sent, but there was an issue saving your full details. Please contact support if login issues persist after verification.",
                variant: "destructive",
                duration: 10000,
            });
        }
      } catch (verificationError) {
          console.error("Failed to send verification email:", verificationError);
          toast({
            title: "Signup Issue",
            description: "Could not send verification email. Please try signing up again or contact support.",
            variant: "destructive",
            duration: 7000,
          });
      }
      
      await signOut(auth); // Sign out the user immediately after signup, forcing them to verify
    }
    return userCredential; // Though user is signed out, return credential for consistency
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
