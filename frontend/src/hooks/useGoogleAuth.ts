"use client";

import { auth, db, googleProvider } from "@/lib/firebase";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { handleUserRedirect } from "@/lib/authUtils";
import { 
  handleGoogleAccountLinking, 
  completeAccountMerge 
} from "@/lib/accountLinking";

export const useGoogleAuth = () => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleAuth = async () => {
    setError(null);
    setLoading(true);
    
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const email = user.email;
      
      if (!email) {
        throw new Error("No email associated with Google account");
      }
      
      // Get the Google credential for potential account linking
      const credential = GoogleAuthProvider.credentialFromResult(result);
      
      if (!credential) {
        throw new Error("Failed to get Google credential");
      }
      
      // Check if we need to handle account linking
      const linkingResult = await handleGoogleAccountLinking(credential, email);
      
      if (!linkingResult.success) {
        throw new Error(linkingResult.message || "Failed to link accounts");
      }
      
      // Check if user document exists
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (!userDoc.exists()) {
        // New user - create user document
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email,
          name: user.displayName,
          onboardingComplete: false,
        });
      }
      
      // If we need to merge accounts, do it now
      if (linkingResult.needsMerge && linkingResult.oldUid) {
        await completeAccountMerge(linkingResult.oldUid, user.uid);
      }
      
      // Handle redirect for both new and existing users
      await handleUserRedirect(user, router);
    } catch (error) {
      console.error("Google auth error:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return { handleGoogleAuth, error, loading };
};
