import { auth, db } from "@/lib/firebase";
import { 
  fetchSignInMethodsForEmail, 
  GoogleAuthProvider, 
  linkWithCredential,
  signInWithCredential,
  AuthCredential
} from "firebase/auth";
import { 
  collection, 
  query, 
  where, 
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  writeBatch
} from "firebase/firestore";

interface UserDocument {
  uid: string;
  email: string;
  name: string;
  onboardingComplete: boolean;
  [key: string]: any;
}

/**
 * Finds an existing user document by email address
 */
export async function findUserByEmail(email: string): Promise<UserDocument | null> {
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("email", "==", email));
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    return null;
  }
  
  return querySnapshot.docs[0].data() as UserDocument;
}

/**
 * Merges data from an old user account to a new one
 * This handles the case where we need to consolidate two separate accounts
 */
async function mergeUserData(oldUid: string, newUid: string): Promise<void> {
  const batch = writeBatch(db);
  
  // Update all products owned by the old user
  const productsRef = collection(db, "products");
  const productsQuery = query(productsRef, where("userId", "==", oldUid));
  const productsSnapshot = await getDocs(productsQuery);
  
  productsSnapshot.forEach((doc) => {
    batch.update(doc.ref, { userId: newUid });
  });
  
  // Update all exchanges where the user is the requester
  const exchangesAsRequesterRef = collection(db, "exchanges");
  const exchangesAsRequesterQuery = query(exchangesAsRequesterRef, where("requesterId", "==", oldUid));
  const exchangesAsRequesterSnapshot = await getDocs(exchangesAsRequesterQuery);
  
  exchangesAsRequesterSnapshot.forEach((doc) => {
    batch.update(doc.ref, { requesterId: newUid });
  });
  
  // Update all exchanges where the user is the owner
  const exchangesAsOwnerQuery = query(exchangesAsRequesterRef, where("ownerId", "==", oldUid));
  const exchangesAsOwnerSnapshot = await getDocs(exchangesAsOwnerQuery);
  
  exchangesAsOwnerSnapshot.forEach((doc) => {
    batch.update(doc.ref, { ownerId: newUid });
  });
  
  // Update all chats where the user is a participant
  const chatsRef = collection(db, "chats");
  const chatsQuery = query(chatsRef, where("participants", "array-contains", oldUid));
  const chatsSnapshot = await getDocs(chatsQuery);
  
  chatsSnapshot.forEach((chatDoc) => {
    const participants = chatDoc.data().participants as string[];
    const updatedParticipants = participants.map(p => p === oldUid ? newUid : p);
    batch.update(chatDoc.ref, { participants: updatedParticipants });
  });
  
  // Update all notifications for the user
  const notificationsRef = collection(db, "notifications");
  const notificationsQuery = query(notificationsRef, where("recipientId", "==", oldUid));
  const notificationsSnapshot = await getDocs(notificationsQuery);
  
  notificationsSnapshot.forEach((doc) => {
    batch.update(doc.ref, { recipientId: newUid });
  });
  
  // Commit all updates
  await batch.commit();
  
  // Delete the old user document
  await deleteDoc(doc(db, "users", oldUid));
}

/**
 * Handles account linking when a user signs in with Google
 * but already has an email/password account
 */
export async function handleGoogleAccountLinking(
  googleCredential: AuthCredential,
  email: string
): Promise<{ success: boolean; message?: string; needsMerge?: boolean; oldUid?: string }> {
  try {
    // Check if there's an existing user with this email
    const existingUser = await findUserByEmail(email);
    
    if (!existingUser) {
      // No existing user, proceed normally
      return { success: true };
    }
    
    // Check what sign-in methods are available for this email
    const signInMethods = await fetchSignInMethodsForEmail(auth, email);
    
    // If the user only has Google sign-in, they're already linked
    if (signInMethods.includes(GoogleAuthProvider.PROVIDER_ID) && signInMethods.length === 1) {
      return { success: true };
    }
    
    // If the user has email/password, we need to handle the linking
    if (signInMethods.includes("password")) {
      // The user has an email/password account
      // We'll need to merge the accounts after Google sign-in completes
      return { 
        success: true, 
        needsMerge: true, 
        oldUid: existingUser.uid,
        message: "An account with this email already exists. Your accounts will be linked."
      };
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error in account linking:", error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Failed to link accounts" 
    };
  }
}

/**
 * Completes the account merge after Google sign-in
 */
export async function completeAccountMerge(oldUid: string, newUid: string): Promise<void> {
  // Get the old user data to preserve important fields
  const oldUserDoc = await getDoc(doc(db, "users", oldUid));
  const oldUserData = oldUserDoc.data();
  
  if (!oldUserData) {
    throw new Error("Old user data not found");
  }
  
  // Get the new user data
  const newUserDoc = await getDoc(doc(db, "users", newUid));
  const newUserData = newUserDoc.data();
  
  if (!newUserData) {
    throw new Error("New user data not found");
  }
  
  // Merge user data, preserving important fields from the old account
  const mergedData = {
    ...newUserData,
    // Preserve onboarding status and other important fields from the old account
    onboardingComplete: oldUserData.onboardingComplete || newUserData.onboardingComplete,
    // Preserve the name from the old account if it exists and is different from email
    name: oldUserData.name || newUserData.name,
    // Preserve reputation data if it exists
    reputation: oldUserData.reputation || newUserData.reputation || 0,
    points: oldUserData.points || newUserData.points || 0,
    level: oldUserData.level || newUserData.level || 1,
    badges: oldUserData.badges || newUserData.badges || [],
  };
  
  // Update the new user document with merged data
  await updateDoc(doc(db, "users", newUid), mergedData);
  
  // Merge all related data (products, exchanges, chats, notifications)
  await mergeUserData(oldUid, newUid);
}
