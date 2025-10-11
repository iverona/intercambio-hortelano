"use client";

import { auth, db, googleProvider } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { handleUserRedirect } from "@/lib/authUtils";

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
      
      // Check if this email is already registered in Firestore with password method
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const existingUserDoc = querySnapshot.docs[0];
        const existingUserData = existingUserDoc.data();
        
        // If the existing user has authMethod "password", don't allow Google sign-in
        if (existingUserData.authMethod === "password") {
          // Sign out the Google user that was just created
          await auth.signOut();
          // Set error without throwing to avoid console error
          setError("This email is registered with email/password. Please sign in using your password.");
          setLoading(false);
          return;
        }
      }
      
      // Check if user document exists for this Google UID
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (!userDoc.exists()) {
        // New user - create user document with authMethod
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email,
          name: user.displayName,
          onboardingComplete: false,
          authMethod: "google",
        });
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
