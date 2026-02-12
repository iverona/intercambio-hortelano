import { auth, functions } from "@/lib/firebase";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
} from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { googleProvider } from "@/lib/firebase";

interface DeleteAccountResult {
  success: boolean;
  error?: string;
}

/**
 * Re-authenticates a user based on their sign-in method.
 * This stays client-side because re-auth requires user interaction (popup/password).
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
    const isGoogleUser = user.providerData.some(
      (provider) => provider.providerId === "google.com"
    );

    if (isGoogleUser) {
      await reauthenticateWithPopup(user, googleProvider);
    } else {
      if (!password) {
        return { success: false, error: "Password required" };
      }
      const credential = EmailAuthProvider.credential(email, password);
      await reauthenticateWithCredential(user, credential);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Re-authentication error:", error);

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
 * Deletes the current user's account via Cloud Function.
 * The Cloud Function uses Admin SDK to archive data, delete Storage files,
 * remove Firestore documents, reject exchanges, and delete the Auth account.
 * userId is derived from the auth token server-side (no impersonation possible).
 */
export async function deleteUserAccount(): Promise<DeleteAccountResult> {
  try {
    const deleteAccount = httpsCallable(functions, "deleteUserAccount");
    const result = await deleteAccount();
    return result.data as DeleteAccountResult;
  } catch (error: any) {
    console.error("Error deleting account:", error);
    return {
      success: false,
      error: error.message || "Failed to delete account. Please try again.",
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
