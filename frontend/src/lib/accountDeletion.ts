import { auth, db, storage } from "@/lib/firebase";
import { ref, deleteObject } from "firebase/storage";
import {
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  GoogleAuthProvider
} from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  updateDoc,
  doc,
  writeBatch,
  serverTimestamp,
  addDoc,
  deleteField
} from "firebase/firestore";
import { googleProvider } from "@/lib/firebase";

interface DeleteAccountResult {
  success: boolean;
  error?: string;
}

/**
 * Re-authenticates a user based on their sign-in method
 */
export async function reauthenticateUser(
  email: string,
  password?: string
): Promise<{ success: boolean; error?: string }> {
  const user = auth.currentUser;
  if (!user) {
    return { success: false, error: "No user logged in" };
  }

  try {
    // Check if user signed in with Google
    const isGoogleUser = user.providerData.some(
      (provider) => provider.providerId === "google.com"
    );

    if (isGoogleUser) {
      // Re-authenticate with Google popup
      await reauthenticateWithPopup(user, googleProvider);
    } else {
      // Re-authenticate with email/password
      if (!password) {
        return { success: false, error: "Password required" };
      }
      const credential = EmailAuthProvider.credential(email, password);
      await reauthenticateWithCredential(user, credential);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Re-authentication error:", error);

    // Handle specific Firebase Auth errors
    if (error.code === "auth/wrong-password") {
      return { success: false, error: "Incorrect password. Please try again." };
    } else if (error.code === "auth/too-many-requests") {
      return { success: false, error: "Too many attempts. Please try again later." };
    } else if (error.code === "auth/popup-closed-by-user") {
      return { success: false, error: "Sign-in popup was closed. Please try again." };
    } else if (error.code === "auth/cancelled-popup-request") {
      return { success: false, error: "Sign-in was cancelled." };
    }

    return { success: false, error: "Re-authentication failed. Please try again." };
  }
}

/**
 * Soft-deletes a user account and all associated data
 */
/**
 * Deletes a user account and all associated data in compliance with GDPR/LOPD.
 * 1. Archives data for 5 years (blocked by security rules).
 * 2. Deletes images from Storage immediately.
 * 3. Hard deletes live data from Firestore.
 */
export async function softDeleteUserAccount(
  userId: string
): Promise<DeleteAccountResult> {
  const user = auth.currentUser;
  if (!user) {
    return { success: false, error: "No user logged in" };
  }

  try {
    // Gather all operations
    let batch = writeBatch(db);
    let operationCount = 0;
    const BATCH_LIMIT = 450;

    const commitBatch = async () => {
      if (operationCount > 0) {
        await batch.commit();
        batch = writeBatch(db);
        operationCount = 0;
      }
    };

    // --- STEP 1: FETCH DATA TO ARCHIVE ---
    console.log("[DELETE] Starting deletion process for:", userId);

    // Fetch User Data
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      console.error("[DELETE] User profile not found");
      return { success: false, error: "User profile not found" };
    }
    const userData = userSnap.data();
    console.log("[DELETE] User data fetched");

    // Fetch User Products
    const productsQuery = query(
      collection(db, "products"),
      where("userId", "==", userId)
    );
    const productsSnapshot = await getDocs(productsQuery);
    const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log("[DELETE] Products fetched:", products.length);

    // --- STEP 2: ARCHIVE DATA (LOPD Compliance) ---
    console.log("[DELETE] Preparing Archive batch...");

    // Archive User
    const archiveUserRef = doc(db, "archived_users", userId);
    batch.set(archiveUserRef, {
      ...userData,
      archivedAt: serverTimestamp(),
      originalUid: userId,
      deletionReason: "user_request"
    });
    operationCount++;

    // Archive Products
    for (const product of products) {
      if (operationCount >= BATCH_LIMIT) await commitBatch();
      const archiveProductRef = doc(db, "archived_users", userId, "products", product.id);
      batch.set(archiveProductRef, {
        ...product,
        archivedAt: serverTimestamp()
      });
      operationCount++;
    }

    // Commit Archival first to ensure data safety
    console.log("[DELETE] Committing Archive batch...");
    await commitBatch();
    console.log("[DELETE] Archive batch committed successfully");


    // --- STEP 3: DELETE IMAGES FROM STORAGE ---
    // We do this "best effort" - if one fails, we log but continue to ensure account is deleted.
    console.log("[DELETE] Starting image cleanup...");

    // Delete Avatar
    if (userData.avatarUrl && userData.avatarUrl.includes("firebasestorage")) {
      try {
        const avatarRef = ref(storage, userData.avatarUrl);
        await deleteObject(avatarRef);
        console.log("[DELETE] Avatar deleted");
      } catch (error) {
        console.warn("Failed to delete avatar from storage:", error);
      }
    }

    // Delete Product Images
    for (const product of products) {
      const p = product as any;
      if (p.imageUrls && Array.isArray(p.imageUrls)) {
        for (const url of p.imageUrls) {
          if (typeof url === 'string' && url.includes("firebasestorage")) {
            try {
              const imgRef = ref(storage, url);
              await deleteObject(imgRef);
              console.log("[DELETE] Product image deleted:", url);
            } catch (err) {
              console.warn(`Failed to delete product image ${url}:`, err);
            }
          }
        }
      }
    }


    // --- STEP 4: HARD DELETE LIVE DATA ---
    console.log("[DELETE] Preparing Delete batch...");

    // Delete User Document
    batch.delete(userRef);
    operationCount++;

    // Delete Product Documents
    for (const docSnap of productsSnapshot.docs) {
      if (operationCount >= BATCH_LIMIT) await commitBatch();
      batch.delete(docSnap.ref);
      operationCount++;
    }

    // --- STEP 5: HANDLE EXCHANGES (REJECT PENDING/ACCEPTED) ---
    // We modify existing exchanges to indicate the user is deleted. We do NOT delete exchanges
    // because the other party needs the record (as per plan "Contextual Inference").

    // Get exchanges where user is the requester
    const requesterExchangesQuery = query(
      collection(db, "exchanges"),
      where("requesterId", "==", userId),
      where("status", "in", ["pending", "accepted"])
    );

    // Get exchanges where user is the owner
    const ownerExchangesQuery = query(
      collection(db, "exchanges"),
      where("ownerId", "==", userId),
      where("status", "in", ["pending", "accepted"])
    );

    const [requesterSnapshot, ownerSnapshot] = await Promise.all([
      getDocs(requesterExchangesQuery),
      getDocs(ownerExchangesQuery),
    ]);

    const allExchanges = [
      ...requesterSnapshot.docs,
      ...ownerSnapshot.docs,
    ];
    console.log("[DELETE] Exchanges to reject:", allExchanges.length);

    for (const exchangeDoc of allExchanges) {
      if (operationCount >= BATCH_LIMIT) await commitBatch();

      const exchangeData = exchangeDoc.data();

      batch.update(exchangeDoc.ref, {
        status: "rejected",
        rejectionReason: "user_deleted",
        updatedAt: serverTimestamp(),
      });
      operationCount++;

      // Notify the other user
      const otherUserId = exchangeData.requesterId === userId
        ? exchangeData.ownerId
        : exchangeData.requesterId;

      if (operationCount >= BATCH_LIMIT) await commitBatch();
      const notifRef = doc(collection(db, "notifications"));
      batch.set(notifRef, {
        recipientId: otherUserId,
        type: "offer_declined",
        exchangeId: exchangeDoc.id,
        productId: exchangeData.productId,
        productName: exchangeData.productName || "Unknown",
        message: "The other user has deleted their account", // Translation handled in UI
        read: false,
        createdAt: serverTimestamp(),
      });
      operationCount++;
    }

    // Commit Deletions and Updates
    console.log("[DELETE] Committing Final batch...");
    await commitBatch();
    console.log("[DELETE] Final batch committed successfully");

    // --- STEP 6: DELETE AUTH ACCOUNT ---
    console.log("[DELETE] Deleting Auth user...");
    await deleteUser(user);
    console.log("[DELETE] Auth user deleted");

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting account:", error);
    return {
      success: false,
      error: error.message || "Failed to delete account. Please try again."
    };
  }
}

/**
 * Checks if the current user signed in with Google
 */
export function isGoogleSignInUser(): boolean {
  const user = auth.currentUser;
  if (!user) return false;

  return user.providerData.some(
    (provider) => provider.providerId === "google.com"
  );
}
