import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { getUserProfile, updateUserProfile } from '../services/userService';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

// Represents all the apartment filter criteria a user can set.
// Keeping this as a named type makes it reusable across the app —
// any component that needs to read or write preferences imports this
// instead of re-defining the shape inline.
export type Preferences = {
  minPrice: number;
  maxPrice: number;
  beds: number;
  bathrooms: number;
  furnished: boolean;
  distance: number;
  parking: boolean;
  wifi: boolean;
  gym: boolean;
  pool: boolean;
  petFriendly: boolean;
  location?: { name: string; lat: number; lon: number };
};

// Defines what the context exposes. setPreferences only updates local state —
// it does NOT auto-save to Firestore. toggleSave is the exception: it updates
// both local state and Firestore immediately on every call.
type PreferencesContextType = {
  preferences: Preferences;
  setPreferences: (prefs: Preferences) => void;
  savedIds: number[];
  toggleSave: (id: number) => void;
  loading: boolean;
};

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

type PreferencesProviderProps = {
  children: ReactNode;
};

export const PreferencesProvider = ({ children }: PreferencesProviderProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  // Default values are applied on first render and also when the user logs out.
  // These mirror the "blank slate" state a new user would see before setting
  // any preferences.
  const [preferences, setPreferences] = useState<Preferences>({
    minPrice: 0,
    maxPrice: 5000,
    beds: 1,
    bathrooms: 1,
    distance: 0.5,
    parking: false,
    wifi: false,
    gym: false,
    pool: false,
    petFriendly: false,
    furnished: false,
  });

  const [savedIds, setSavedIds] = useState<number[]>([]);

  // Runs whenever the authenticated user changes (sign in, sign out, or account switch).
  // On sign-out (user?.uid is falsy) we reset everything back to defaults so stale
  // data from the previous session never bleeds into a fresh one.
  //
  // When a user is present we set up a Firestore onSnapshot listener instead of a
  // one-time fetch — this means preferences stay in sync across multiple devices or
  // tabs automatically without any extra polling logic.
  //
  // Returning unsubscribe() as the cleanup ensures the Firestore listener is torn
  // down when the user changes or the provider unmounts, avoiding memory leaks and
  // stale callbacks.
  useEffect(() => {
    if (!user?.uid) {
      // Reset to defaults when logged out
      setPreferences({
        minPrice: 0,
        maxPrice: 5000,
        beds: 1,
        bathrooms: 1,
        distance: 0.5,
        parking: false,
        wifi: false,
        gym: false,
        pool: false,
        petFriendly: false,
        furnished: false,
        location: undefined,
      });
      setSavedIds([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Set up real-time listener
    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(
      userDocRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const userProfile = docSnapshot.data();

          // The ?? fallbacks guard against partially-written Firestore documents
          // where a field exists on the type but was never set — ensures we always
          // have a valid value in state rather than undefined.
          if (userProfile && userProfile.preferences) {
            setPreferences({
              minPrice: userProfile.preferences.minPrice ?? 0,
              maxPrice: userProfile.preferences.maxPrice ?? 5000,
              beds: userProfile.preferences.bedrooms ?? 1,
              bathrooms: userProfile.preferences.bathrooms ?? 1,
              distance: userProfile.preferences.maxDistance ?? 0.5,
              parking: userProfile.preferences.parking ?? false,
              wifi: userProfile.preferences.wifi ?? false,
              gym: userProfile.preferences.gym ?? false,
              pool: userProfile.preferences.pool ?? false,
              petFriendly: userProfile.preferences.petFriendly ?? false,
              furnished: userProfile.preferences.furnished ?? false,
              location: userProfile.preferences.location ?? null,
            });
          }

          // Load saved apartments
          if (userProfile?.savedApartments) {
            setSavedIds(userProfile.savedApartments.map((id) => parseInt(id)));
          }
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error in preferences listener:', error);
        setLoading(false);
      }
    );

    // Cleanup listener when component unmounts or user changes
    return () => unsubscribe();
  }, [user?.uid]);

  // Just update local state - NO auto-save to Firestore
  // Saves only happen when user clicks "Save Preferences" button
  const handleSetPreferences = (prefs: Preferences) => {
    setPreferences(prefs);
  };

  // Optimistically updates local state first so the UI responds immediately,
  // then syncs to Firestore in the background. If the Firestore write fails,
  // the local state is already updated — worth considering a rollback here if
  // consistency is critical.
  const toggleSave = async (id: number) => {
    const newSavedIds = savedIds.includes(id)
      ? savedIds.filter((savedId) => savedId !== id)
      : [...savedIds, id];

    setSavedIds(newSavedIds);

    // Save to Firestore if user is logged in
    if (user?.uid) {
      try {
        await updateUserProfile(user.uid, {
          savedApartments: newSavedIds.map((id) => id.toString()),
        });
        console.log('Saved apartments synced to Firestore');
      } catch (error) {
        console.error('Error syncing saved apartments:', error);
      }
    }
  };

  return (
    <PreferencesContext.Provider
      value={{
        preferences,
        setPreferences: handleSetPreferences,
        savedIds,
        toggleSave,
        loading,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
};

// Same pattern as useAuth — custom hook for ergonomics and a clear error if
// called outside of PreferencesProvider.
export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};