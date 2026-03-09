import { db, auth } from './config';
import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';

// Run this once to fix all leaves
async function migrateLeaves() {
  try {
    // 1. Get all users
    const usersSnap = await getDocs(collection(db, "users"));
    const users = {};
    usersSnap.docs.forEach(doc => {
      users[doc.data().email] = doc.id; // Map email to UID
    });
    console.log("Users mapping:", users);

    // 2. Get all leaves
    const leavesSnap = await getDocs(collection(db, "leaves"));
    
    for (const leaveDoc of leavesSnap.docs) {
      const leave = leaveDoc.data();
      const correctUid = users[leave.employeeEmail];
      
      if (correctUid && leave.employeeId !== correctUid) {
        console.log(`Fixing leave ${leaveDoc.id}: ${leave.employeeId} -> ${correctUid}`);
        
        await updateDoc(doc(db, "leaves", leaveDoc.id), {
          employeeId: correctUid
        });
      }
    }
    
    console.log("Migration complete!");
  } catch (error) {
    console.error("Migration error:", error);
  }
}

// Run this
migrateLeaves();