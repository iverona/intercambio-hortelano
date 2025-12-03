import { auth, db } from "@/lib/firebase";
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
export async function softDeleteUserAccount(
  userId: string
): Promise<DeleteAccountResult> {
  const user = auth.currentUser;
  if (!user) {
    return { success: false, error: "No user logged in" };
  }

  try {
    // Gather all operations first
    const operations: (() => void)[] = [];
    let batch = writeBatch(db);
    let operationCount = 0;
    const BATCH_LIMIT = 450; // Safety margin below 500

    const commitBatch = async () => {
      if (operationCount > 0) {
        await batch.commit();
        batch = writeBatch(db);
        operationCount = 0;
      }
    };

    // 1. Update user document - soft delete and anonymize
    const userRef = doc(db, "users", userId);
    batch.update(userRef, {
      deleted: true,
      deletedAt: serverTimestamp(),
      name: "Deleted User",
      bio: "",
      avatarUrl: "",
      email: deleteField(),
      address: deleteField(),
      location: deleteField(),
      geohash: deleteField(),
      locationUpdatedAt: deleteField(),
      notifications: deleteField(),
      privacy: deleteField(),
      authMethod: deleteField(),
      reputation: deleteField(),
      points: deleteField(),
      level: deleteField(),
      badges: deleteField(),
      onboardingComplete: deleteField(),
      lastUpdated: deleteField(),
      joinedDate: deleteField(),
    });
    operationCount++;

    // 2. Mark all user's products as deleted
    const productsQuery = query(
      collection(db, "products"),
      where("userId", "==", userId)
    );
    const productsSnapshot = await getDocs(productsQuery);

    for (const doc of productsSnapshot.docs) {
      if (operationCount >= BATCH_LIMIT) await commitBatch();
      batch.update(doc.ref, {
        deleted: true,
        deletedAt: serverTimestamp(),
      });
      operationCount++;
    }

    // 3. Reject all active and pending exchanges
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

    // Combine all exchanges
    const allExchanges = [
      ...requesterSnapshot.docs,
      ...ownerSnapshot.docs,
    ];

    // Reject exchanges and create notifications
    for (const exchangeDoc of allExchanges) {
      const exchangeData = exchangeDoc.data();

      // Update exchange status
      if (operationCount >= BATCH_LIMIT) await commitBatch();
      batch.update(exchangeDoc.ref, {
        status: "rejected",
        rejectionReason: "user_deleted",
        updatedAt: serverTimestamp(),
      });
      operationCount++;

      // Determine the other user (the one who isn't deleted)
      const otherUserId = exchangeData.requesterId === userId
        ? exchangeData.ownerId
        : exchangeData.requesterId;

      // Create notification for the other user
      if (operationCount >= BATCH_LIMIT) await commitBatch();
      const notifRef = doc(collection(db, "notifications"));
      batch.set(notifRef, {
        userId: otherUserId,
        type: "offer_declined",
        exchangeId: exchangeDoc.id,
        productId: exchangeData.productId,
        productName: exchangeData.productName || "Unknown Product",
        message: "The other user has deleted their account",
        read: false,
        createdAt: serverTimestamp(),
      });
      operationCount++;
    }

    // Commit any remaining operations
    await commitBatch();

    // 4. Delete Firebase Auth account (this will sign out the user)
    await deleteUser(user);

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
