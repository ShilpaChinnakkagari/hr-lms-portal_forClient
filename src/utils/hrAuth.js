import { db } from '../firebase/config';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

// This will fetch HR email from Firebase (if you still want to use it)
export const getHREmail = async () => {
  try {
    const settingsRef = doc(db, "settings", "hr");
    const settingsSnap = await getDoc(settingsRef);
    if (settingsSnap.exists()) {
      return settingsSnap.data().email;
    }
    return null; // Don't return hardcoded fallback
  } catch (error) {
    console.error("Error fetching HR email:", error);
    return null; // Don't return hardcoded fallback
  }
};

// NEW: Check if user exists in database
export const checkUserExists = async (userEmail) => {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", userEmail));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error("Error checking user:", error);
    return false;
  }
};

// Check if user has HR role in database
export const checkUserIsHR = async (userEmail) => {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", userEmail));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const userData = querySnapshot.docs[0].data();
      return userData.role === 'hr';
    }
    return false;
  } catch (error) {
    console.error("Error checking user role:", error);
    return false;
  }
};

// For synchronous checks
let cachedHREmail = null;

export const setCachedHREmail = (email) => {
  cachedHREmail = email;
};

export const getCachedHREmail = () => cachedHREmail;