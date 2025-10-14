"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/locales/provider";
import LocationSearchInput from "@/components/shared/LocationSearchInput";
import { MapPin } from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";

export default function OnboardingPage() {
  const t = useI18n();
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const { getCurrentLocation, loading: geoLoading, error: geoError, clearError } = useGeolocation();

  const handleLocation = async () => {
    clearError();
    const locationData = await getCurrentLocation();
    
    if (locationData && user) {
      setSaving(true);
      try {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          location: {
            latitude: locationData.latitude,
            longitude: locationData.longitude,
          },
          geohash: locationData.geohash,
          onboardingComplete: true,
        });
        // Refresh the user state before redirecting
        await refreshUser();
        router.push("/");
      } catch (error) {
        console.error("Failed to update location:", error);
        setSaving(false);
      }
    }
  };

  const handleManualLocationSelect = async (location: {
    latitude: number;
    longitude: number;
    geohash: string;
    address: string;
  }) => {
    if (user) {
      setSaving(true);
      clearError();
      try {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          location: {
            latitude: location.latitude,
            longitude: location.longitude,
          },
          geohash: location.geohash,
          address: location.address,
          onboardingComplete: true,
        });
        // Refresh the user state before redirecting
        await refreshUser();
        router.push("/");
      } catch (error) {
        console.error("Failed to update location:", error);
        setSaving(false);
      }
    }
  };

  const handleEnterManually = () => {
    setShowManualInput(true);
    clearError();
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('onboarding.welcome')}</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-6">
            {t('onboarding.description')}
          </p>
          
          {!showManualInput ? (
            <>
              <div className="flex gap-4 justify-center">
                <Button onClick={handleLocation} disabled={geoLoading || saving}>
                  <MapPin className="mr-2 h-4 w-4" />
                  {geoLoading || saving ? t('onboarding.loading_button') : t('onboarding.share_location_button')}
                </Button>
                <Button onClick={handleEnterManually} variant="outline" disabled={geoLoading || saving}>
                  {t('onboarding.enter_manually_button')}
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                {t('onboarding.manual_input_description')}
              </p>
              <LocationSearchInput
                onLocationSelect={handleManualLocationSelect}
                placeholder={t('onboarding.location_search_placeholder')}
                className="w-full"
              />
              <Button
                onClick={() => {
                  setShowManualInput(false);
                  clearError();
                }}
                variant="outline"
                className="w-full"
                disabled={saving}
              >
                {t('onboarding.back_button')}
              </Button>
            </div>
          )}
          
          {geoError && <p className="text-red-500 text-sm mt-4">{geoError}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
