import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { getUserProfile, updateUserProfile } from '../services/userService';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

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

type PreferencesContextType = {
  preferences: Preferences;
  setPreferences: (prefs: Preferences) => void;
  savedIds: number[]; 
  toggleSave: (id: number) => void;
  loading: boolean;
};

const PreferencesContext = createContext<PreferencesContextType | undefined>(
  undefined
);

type PreferencesProviderProps = {
  children: ReactNode;
};

export const PreferencesProvider = ({ children }: PreferencesProviderProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
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

  // Load preferences from Firestore when user signs in
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
    const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const userProfile = docSnapshot.data();
        
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
          setSavedIds(userProfile.savedApartments.map(id => parseInt(id)));
        }
      }
      setLoading(false);
    }, (error) => {
      console.error('Error in preferences listener:', error);
      setLoading(false);
    });

    // Cleanup listener when component unmounts or user changes
    return () => unsubscribe();
  }, [user?.uid]);

  // Just update local state - NO auto-save to Firestore
  // Saves only happen when user clicks "Save Preferences" button
  const handleSetPreferences = (prefs: Preferences) => {
    setPreferences(prefs);
  };

  // Toggle save with Firestore sync
  const toggleSave = async (id: number) => {
    const newSavedIds = savedIds.includes(id) 
      ? savedIds.filter((savedId) => savedId !== id)
      : [...savedIds, id];
    
    setSavedIds(newSavedIds);

    // Save to Firestore if user is logged in
    if (user?.uid) {
      try {
        await updateUserProfile(user.uid, {
          savedApartments: newSavedIds.map(id => id.toString()),
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

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};