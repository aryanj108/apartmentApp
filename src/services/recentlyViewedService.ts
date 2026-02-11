import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

// Maximum number of recently viewed items to store
const MAX_RECENT_ITEMS = 20;

// Debounce timer
let updateTimer: NodeJS.Timeout | null = null;
const DEBOUNCE_DELAY = 2000; // 2 seconds

// Pending updates queue
let pendingUpdate: {
  uid: string;
  recentlyViewed: number[];
} | null = null;

/**
 * Add a listing to recently viewed (immediate local update, debounced Firestore sync)
 * @param uid User ID
 * @param listingId Listing ID to add
 * @param currentRecentlyViewed Current recently viewed array from local state
 * @returns Updated recently viewed array
 */
export function addToRecentlyViewed(
  uid: string,
  listingId: number,
  currentRecentlyViewed: number[]
): number[] {
  // Remove the listing if it already exists (we'll add it to the front)
  const filtered = currentRecentlyViewed.filter(id => id !== listingId);
  
  // Add to the front of the array
  const updated = [listingId, ...filtered];
  
  // Trim to max size
  const trimmed = updated.slice(0, MAX_RECENT_ITEMS);
  
  // Queue the Firestore update (debounced)
  queueFirestoreUpdate(uid, trimmed);
  
  return trimmed;
}

/**
 * Queue a Firestore update with debouncing to avoid excessive writes
 */
function queueFirestoreUpdate(uid: string, recentlyViewed: number[]) {
  // Store the pending update
  pendingUpdate = { uid, recentlyViewed };
  
  // Clear existing timer
  if (updateTimer) {
    clearTimeout(updateTimer);
  }
  
  // Set new timer
  updateTimer = setTimeout(() => {
    if (pendingUpdate) {
      performFirestoreUpdate(pendingUpdate.uid, pendingUpdate.recentlyViewed);
      pendingUpdate = null;
    }
  }, DEBOUNCE_DELAY);
}

/**
 * Perform the actual Firestore update
 */
async function performFirestoreUpdate(uid: string, recentlyViewed: number[]) {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      recentlyViewed: recentlyViewed.map(id => id.toString()),
      updatedAt: new Date().toISOString(),
    });
    console.log('Recently viewed synced to Firestore');
  } catch (error) {
    console.error('Error syncing recently viewed:', error);
    // Don't throw - we don't want to break the user experience
  }
}

/**
 * Force immediate sync (useful for app backgrounding or logout)
 */
export async function flushRecentlyViewed() {
  // Clear the debounce timer
  if (updateTimer) {
    clearTimeout(updateTimer);
    updateTimer = null;
  }
  
  // Execute pending update immediately
  if (pendingUpdate) {
    await performFirestoreUpdate(pendingUpdate.uid, pendingUpdate.recentlyViewed);
    pendingUpdate = null;
  }
}

/**
 * Clear recently viewed history
 */
export async function clearRecentlyViewed(uid: string) {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      recentlyViewed: [],
      updatedAt: new Date().toISOString(),
    });
    console.log('Recently viewed cleared');
  } catch (error) {
    console.error('Error clearing recently viewed:', error);
    throw error;
  }
}