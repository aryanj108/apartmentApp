import React, { createContext, useState, useContext, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  reload,
  User,
} from 'firebase/auth';
import { auth } from '../config/firebaseConfig';
import { checkUserOnboardingStatus, createUserProfile } from '../services/userService';

// Defines the shape of everything the Auth context exposes to the rest of the app.
// Using a TypeScript interface gives us autocomplete and compile-time safety at
// every call site — no guessing what properties exist on the context object.
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

// Initialized with `undefined` as a sentinel — the real value gets injected by
// AuthProvider below. Any component calling useAuth() outside of AuthProvider
// will hit the guard in useAuth() and throw a descriptive error instead of
// silently failing with a null reference.
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider wraps the component tree (typically at the app root) and owns all
// auth state. Child components never import from Firebase directly — they go through
// this provider, keeping auth logic centralized and easy to swap out later (e.g.
// moving from Firebase to Supabase wouldn't require touching every component).
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);

  // onAuthStateChanged is a Firebase real-time subscription that fires whenever
  // the user signs in, signs out, or their token refreshes. We piggyback on this
  // to also fetch onboarding status so the router knows which screen to show
  // without needing a separate fetch on mount.
  //
  // Returning `unsubscribe` from useEffect is the React cleanup pattern — it
  // tears down the Firebase listener when AuthProvider unmounts, preventing memory leaks.
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
        // Reset to null (not false) so consumers can distinguish "logged out"
        // from "logged in but hasn't completed onboarding"
        setHasCompletedOnboarding(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // On a successful sign-in, onAuthStateChanged fires automatically and updates
  // `user` state — we don't need to call setUser here manually.
  const signInWithEmail = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error('Email sign in error:', err);
      setError(err.message || 'Failed to sign in');
      throw err; // re-throw so the calling UI can react (e.g. show an error banner)
    } finally {
      setLoading(false);
    }
  };

  // Creates the Firebase Auth account then immediately writes a Firestore user
  // profile. Doing both in sequence ensures we never have a Firebase Auth user
  // without a corresponding app-level profile document.
  //
  // Worth discussing: if createUserProfile fails after Auth succeeds, we end up
  // in a partial-write state. Retry logic or a Firebase Cloud Function trigger
  // on user creation are cleaner long-term solutions for this.
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

  // Clears the Firebase session. onAuthStateChanged will fire with null and
  // reset `user` state automatically. We also reset onboarding immediately here
  // so the UI responds before the async listener callback runs.
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

  // Delegates entirely to Firebase, which handles rate-limiting and email delivery.
  // We just surface any errors back to the UI.
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

  // Guard clause up front so we fail fast with a clear message if there's no
  // active session, rather than letting Firebase throw a cryptic internal error.
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

  // Firebase caches the User object locally, so emailVerified won't update on
  // its own after the user clicks the verification link. reload() forces a fresh
  // fetch from Firebase servers. We spread into a new object to trigger a React
  // re-render — Firebase mutates the existing User object in place, which wouldn't
  // cause a state update on its own.
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

  // Everything exposed here is accessible to any component inside AuthProvider
  // via the useAuth() hook. Keeping this surface intentional (no raw Firebase
  // imports leaking out) means the rest of the codebase stays decoupled from
  // Firebase specifics.
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

// Wrapping useContext in a custom hook serves two purposes:
// 1. Ergonomics — consumers import one thing (useAuth) instead of two (useContext + AuthContext)
// 2. Safety — the undefined check catches components rendered outside AuthProvider at
//    runtime with a clear error, rather than a confusing crash somewhere downstream.
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}