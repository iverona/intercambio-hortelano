"use client";

import { AuthService } from "@/services/auth.service";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { handleUserRedirect } from "@/lib/authUtils";
import { useI18n } from "@/locales/provider";

export const useGoogleAuth = () => {
  const router = useRouter();
  const t = useI18n();
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
    } catch (error: any) {
      console.error("Google auth error:", error);
      const errorCode = error?.code;

      switch (errorCode) {
        case 'auth/popup-closed-by-user':
          setError(t('login.error.popup_closed'));
          break;
        case 'auth/account-exists-with-different-credential':
          setError(t('login.error.account_exists'));
          break;
        case 'auth/cancelled-popup-request':
          // Ignore multiple popup requests
          break;
        default:
          setError(error instanceof Error ? error.message : t('login.error.generic'));
      }
    } finally {
      setLoading(false);
    }
  };

  return { handleGoogleAuth, error, loading };
};

