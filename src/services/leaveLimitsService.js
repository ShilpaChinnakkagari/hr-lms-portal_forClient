import { db } from '../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Default fallback values
const DEFAULT_LIMITS = {
  cas: 12,
  sic: 10,
  ear: 15,
  mar: 5,
  ber: 3
};

// Get leave limits from Firebase
export const getLeaveLimits = async () => {
  try {
    const limitsRef = doc(db, "settings", "leaveLimits");
    const limitsSnap = await getDoc(limitsRef);
    
    if (limitsSnap.exists()) {
      return limitsSnap.data();
    }
    return DEFAULT_LIMITS;
  } catch (error) {
    console.error("Error fetching leave limits:", error);
    return DEFAULT_LIMITS;
  }
};

// Save leave limits to Firebase
export const saveLeaveLimits = async (limits) => {
  try {
    const limitsRef = doc(db, "settings", "leaveLimits");
    await setDoc(limitsRef, {
      ...limits,
      updatedAt: new Date(),
      updatedBy: auth.currentUser?.email
    });
    return true;
  } catch (error) {
    console.error("Error saving leave limits:", error);
    return false;
  }
};

// For quick access in components
export const getDefaultLimits = () => DEFAULT_LIMITS;