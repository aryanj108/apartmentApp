import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

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

/**
 * Create a new user profile in Firestore
 */
export async function createUserProfile(uid: string, email: string, additionalData?: Partial<UserProfile>) {
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

/**
 * Get user profile from Firestore
 */
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

/**
 * Update user profile in Firestore
 */
export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
  try {
    const userRef = doc(db, 'users', uid);
    
    await setDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    
    console.log('User profile updated successfully');
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(uid: string, preferences: UserProfile['preferences']) {
  try {
    const userRef = doc(db, 'users', uid);
    
    await setDoc(userRef, {
      preferences,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    
    console.log('User preferences updated successfully');
  } catch (error) {
    console.error('Error updating preferences:', error);
    throw error;
  }
}

/**
 * Add apartment to saved list
 */
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

/**
 * Remove apartment from saved list
 */
export async function unsaveApartment(uid: string, apartmentId: string) {
  try {
    const userProfile = await getUserProfile(uid);
    const savedApartments = userProfile?.savedApartments || [];
    
    const updatedApartments = savedApartments.filter(id => id !== apartmentId);
    await updateUserProfile(uid, { savedApartments: updatedApartments });
    console.log('Apartment unsaved successfully');
  } catch (error) {
    console.error('Error unsaving apartment:', error);
    throw error;
  }
}