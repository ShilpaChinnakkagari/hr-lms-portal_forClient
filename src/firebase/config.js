import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD14lgN3TjFF78OVWn4sVXjMujS4VEpmVE",
  authDomain: "hr-lms-portal.firebaseapp.com",
  projectId: "hr-lms-portal",
  storageBucket: "hr-lms-portal.firebasestorage.app",
  messagingSenderId: "1042448624376",
  appId: "1:1042448624376:web:12c800f08dc821d2da290d",
  measurementId: "G-8QWBVT4RRQ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);