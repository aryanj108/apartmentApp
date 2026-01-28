import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  reload,
  User
} from 'firebase/auth';
import { auth } from '../config/firebaseConfig';
import { checkUserOnboardingStatus, createUserProfile } from '../services/userService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  hasCompletedOnboarding: boolean | null;  
  setHasCompletedOnboarding: (status: boolean) => void;  
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  reloadUser: () => Promise<void>;
  error: string | null;
  setError: (error: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        // Check onboarding status when user is authenticated
        try {
          const status = await checkUserOnboardingStatus(user.uid);
          setHasCompletedOnboarding(status);
        } catch (error) {
          console.error('Error checking onboarding status:', error);
          setHasCompletedOnboarding(false);
        }
      } else {
        setHasCompletedOnboarding(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Sign in with email and password
  const signInWithEmail = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error('Email sign in error:', err);
      setError(err.message || 'Failed to sign in');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sign up with email and password
  const signUpWithEmail = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user profile in Firestore
      await createUserProfile(userCredential.user.uid, email);
      
      // Set onboarding status to false for new users
      setHasCompletedOnboarding(false);
      
    } catch (err: any) {
      console.error('Email sign up error:', err);
      setError(err.message || 'Failed to create account');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      setError(null);
      await firebaseSignOut(auth);
      setHasCompletedOnboarding(null);
    } catch (err: any) {
      console.error('Sign out error:', err);
      setError(err.message || 'Failed to sign out');
      throw err;
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || 'Failed to send reset email');
      throw err;
    }
  };

  // Send email verification
  const sendVerificationEmail = async () => {
    try {
      if (!auth.currentUser) {
        throw new Error('No user signed in');
      }
      await sendEmailVerification(auth.currentUser);
    } catch (err: any) {
      console.error('Send verification error:', err);
      setError(err.message || 'Failed to send verification email');
      throw err;
    }
  };

  // Reload user to check verification status
  const reloadUser = async () => {
    try {
      if (auth.currentUser) {
        await reload(auth.currentUser);
        // Force update by creating a new object reference
        setUser({ ...auth.currentUser });
      }
    } catch (err: any) {
      console.error('Reload user error:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        hasCompletedOnboarding,
        setHasCompletedOnboarding,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        resetPassword,
        sendVerificationEmail,
        reloadUser,
        error,
        setError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}