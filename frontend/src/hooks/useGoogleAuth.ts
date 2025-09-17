"use client";

import { auth, db, googleProvider } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (!userDoc.exists()) {
        // New user - create user document and redirect to onboarding
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email,
          name: user.displayName,
        });
        router.push("/onboarding");
      } else {
        // Existing user - redirect to home
        router.push("/");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return { handleGoogleAuth, error, loading };
};
