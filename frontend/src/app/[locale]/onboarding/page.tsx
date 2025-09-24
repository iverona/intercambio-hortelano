"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/locales/provider";

export default function OnboardingPage() {
  const t = useI18n();
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          if (user) {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
              location: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              },
              onboardingComplete: true,
            });
            // Refresh the user state before redirecting
            await refreshUser();
            router.push("/");
          }
        },
        (error) => {
          setError(t('onboarding.error.no_location'));
          setLoading(false);
        }
      );
    } else {
      setError(t('onboarding.error.no_geolocation'));
    }
  };

  const handleSkip = async () => {
    if (user) {
      try {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          onboardingComplete: true,
        });
        // Refresh the user state before redirecting
        await refreshUser();
        router.push("/");
      } catch (error) {
        // Handle potential error, e.g., show a message
        setError("Could not update onboarding status. Please try again.");
      }
    } else {
      // If no user, just redirect
      router.push("/");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('onboarding.welcome')}</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4">
            {t('onboarding.description')}
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={handleLocation} disabled={loading}>
              {loading ? t('onboarding.loading_button') : t('onboarding.share_location_button')}
            </Button>
            <Button onClick={handleSkip} variant="outline">
              {t('onboarding.skip_button')}
            </Button>
          </div>
          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
