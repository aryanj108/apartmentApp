import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

// TypeScript interface for the Firestore user document shape.
// Optional fields (?) mean they may not exist on older documents — all reads
// should use nullish coalescing (??) to handle missing fields safely.
export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  preferences?: {
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number;
    bathrooms?: number;
    maxDistance?: number;
    wifi?: boolean;
    gym?: boolean;
    pool?: boolean;
    parking?: boolean;
    furnished?: boolean;
    petFriendly?: boolean;
  };
  savedApartments?: string[];
  createdAt?: any;
  updatedAt?: any;
}

// Creates the initial Firestore document for a new user immediately after
// Firebase Auth account creation. serverTimestamp() writes the server's clock
// rather than the client's, which is more reliable across time zones and devices.
// additionalData allows extra fields (e.g. displayName) to be written in the
// same call without a separate update round-trip.
export async function createUserProfile(
  uid: string,
  email: string,
  additionalData?: Partial<UserProfile>
) {
  try {
    const userRef = doc(db, 'users', uid);

    const userData: UserProfile = {
      uid,
      email,
      ...additionalData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(userRef, userData);
    console.log('User profile created successfully');
    return userData;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
}

// One-time fetch of the user's Firestore document. Used for cases where a
// real-time subscription (onSnapshot) isn't needed — e.g. reading saved
// apartments before performing a toggle operation.
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data() as UserProfile;
    } else {
      console.log('No user profile found');
      return null;
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
}

// General-purpose profile updater. Uses setDoc with { merge: true } instead
// of updateDoc so it safely creates the document if it doesn't exist yet,
// rather than throwing on a missing document. Always stamps updatedAt so we
// have an audit trail of when data last changed.
export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
  try {
    const userRef = doc(db, 'users', uid);

    await setDoc(
      userRef,
      {
        ...data,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    console.log('User profile updated successfully');
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

// Writes the entire preferences object in one operation. Using setDoc with
// merge means only the preferences field is touched — other profile fields
// (savedApartments, onboarding status, etc.) are left unchanged.
export async function updateUserPreferences(
  uid: string,
  preferences: UserProfile['preferences']
) {
  try {
    const userRef = doc(db, 'users', uid);

    await setDoc(
      userRef,
      {
        preferences,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    console.log('User preferences updated successfully');
  } catch (error) {
    console.error('Error updating preferences:', error);
    throw error;
  }
}

// Fetches the current saved list, appends the new id if not already present,
// then writes the updated array back. The duplicate check prevents the same
// apartment appearing twice if the user taps save rapidly.
// Note: PreferencesContext's toggleSave is the primary save path — these
// functions exist as lower-level utilities if needed elsewhere.
export async function saveApartment(uid: string, apartmentId: string) {
  try {
    const userProfile = await getUserProfile(uid);
    const savedApartments = userProfile?.savedApartments || [];

    if (!savedApartments.includes(apartmentId)) {
      savedApartments.push(apartmentId);
      await updateUserProfile(uid, { savedApartments });
      console.log('Apartment saved successfully');
    }
  } catch (error) {
    console.error('Error saving apartment:', error);
    throw error;
  }
}

// Filters the id out of the saved list and writes the result back.
// filter() is used instead of splice() so the original array is never mutated.
export async function unsaveApartment(uid: string, apartmentId: string) {
  try {
    const userProfile = await getUserProfile(uid);
    const savedApartments = userProfile?.savedApartments || [];

    const updatedApartments = savedApartments.filter((id) => id !== apartmentId);
    await updateUserProfile(uid, { savedApartments: updatedApartments });
    console.log('Apartment unsaved successfully');
  } catch (error) {
    console.error('Error unsaving apartment:', error);
    throw error;
  }
}

// Reads the hasCompletedOnboarding flag from the user's Firestore document.
// Called by onAuthStateChanged in AuthContext on every sign-in so the router
// knows which screen to show without a separate fetch. Returns false (not null)
// on any error so the app fails safe — showing onboarding again is less
// disruptive than blocking a user from the app entirely.
export const checkUserOnboardingStatus = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data().hasCompletedOnboarding || false;
    }
    return false;
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return false;
  }
};

// Marks onboarding complete and records an ISO timestamp. Using a plain
// ISO string (not serverTimestamp) here since this is a one-time write and
// the exact precision of serverTimestamp isn't needed.
export const setUserOnboardingComplete = async (uid) => {
  try {
    await updateDoc(doc(db, 'users', uid), {
      hasCompletedOnboarding: true,
      onboardingCompletedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error setting onboarding complete:', error);
    throw error;
  }
};

// Resets the onboarding flag so the user is taken back through the
// preferences and swipe flow on next login. Used when the user deliberately
// wants to redo their preferences from the profile screen.
export const resetUserOnboarding = async (uid) => {
  try {
    await updateDoc(doc(db, 'users', uid), {
      hasCompletedOnboarding: false,
    });
  } catch (error) {
    console.error('Error resetting onboarding:', error);
    throw error;
  }
};