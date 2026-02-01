"use client";

import { AuthService } from "@/services/auth.service";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { handleUserRedirect } from "@/lib/authUtils";

export const useGoogleAuth = () => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleAuth = async (consentOrEvent?: any) => {
    setError(null);
    setLoading(true);

    // If passed from an onClick, it might be an event object.
    // We only want to pass actual consent data.
    const consent = (consentOrEvent && typeof consentOrEvent === 'object' && 'privacyAccepted' in consentOrEvent)
      ? consentOrEvent
      : undefined;

    try {
      const user = await AuthService.loginWithGoogle(consent);

      if (user) {
        // Handle redirect
        await handleUserRedirect(user, router);
      }
    } catch (error) {
      console.error("Google auth error:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return { handleGoogleAuth, error, loading };
};

