"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { db, storage } from "@/lib/firebase";
import { doc, updateDoc, getDoc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateProfile } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useI18n } from "@/locales/provider";
import LocationSearchInput from "@/components/shared/LocationSearchInput";
import { MapPin, User, Camera, Loader2, ArrowLeft, ShieldCheck, LogOut } from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { fuzzLocation, getApproximateAddress } from "@/lib/locationUtils";
import imageCompression from "browser-image-compression";
import { toast } from "sonner";
import { OrganicBackground } from "@/components/shared/OrganicBackground";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { AuthService } from "@/services/auth.service";
import { softDeleteUserAccount } from "@/lib/accountDeletion";

export default function OnboardingPage() {
  const t = useI18n();
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const { getCurrentLocation, loading: geoLoading, error: geoError, clearError } = useGeolocation();

  // Step 1: Profile information
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Old useEffect removed as it is merged with the consent check one


  // Step 2: Location data (will be set when user selects location)
  const [locationData, setLocationData] = useState<{
    latitude: number;
    longitude: number;
    geohash: string;
    address?: string;
  } | null>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('profile.avatar_error_size'));
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleStep1Continue = () => {
    if (!name.trim()) {
      toast.error(t('onboarding.name_required'));
      return;
    }
    if (name.trim().length < 2) {
      toast.error(t('onboarding.name_too_short'));
      return;
    }
    if (!bio.trim()) {
      toast.error(t('onboarding.bio_required'));
      return;
    }
    if (bio.trim().length < 10) {
      toast.error(t('onboarding.bio_too_short'));
      return;
    }
    if (bio.trim().length > 500) {
      toast.error(t('onboarding.bio_too_long'));
      return;
    }
    setCurrentStep(2);
  };

  const handleLocation = async () => {
    clearError();
    const location = await getCurrentLocation();

    if (location && user) {
      setLocationData(location);
      await completeOnboarding(location);
    }
  };

  const handleManualLocationSelect = async (location: {
    latitude: number;
    longitude: number;
    geohash: string;
    address: string;
  }) => {
    if (user) {
      setLocationData(location);
      await completeOnboarding(location);
    }
  };

  const completeOnboarding = async (location: {
    latitude: number;
    longitude: number;
    geohash: string;
    address?: string;
  }) => {
    if (!user) return;

    setSaving(true);
    clearError();

    try {
      let avatarUrl = "";

      // Upload avatar if provided
      if (avatarFile) {
        setIsUploadingAvatar(true);
        const compressedFile = await imageCompression(avatarFile, {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 512,
          useWebWorker: true,
        });

        const storageRef = ref(storage, `avatars/${user.uid}/${crypto.randomUUID()}.${compressedFile.name.split('.').pop()}`);
        await uploadBytes(storageRef, compressedFile);
        avatarUrl = await getDownloadURL(storageRef);
        setIsUploadingAvatar(false);
      }

      // Update Firestore with all onboarding data
      const userRef = doc(db, "users", user.uid);
      // Fuzz the location before saving to protect privacy
      const fuzzedCoords = fuzzLocation(location.latitude, location.longitude);

      const updateData: any = {
        name: name.trim(),
        bio: bio.trim(),
        location: {
          latitude: fuzzedCoords.latitude,
          longitude: fuzzedCoords.longitude,
        },
        geohash: location.geohash, // Note: Geohash will still correspond to the original area, which is fine for broad searches
        onboardingComplete: true,
      };

      if (avatarUrl) {
        updateData.avatarUrl = avatarUrl;
      }

      // Generalize address to protect privacy
      if (location.address) {
        updateData.address = getApproximateAddress(location.address);
      }

      await updateDoc(userRef, updateData);

      // Update Auth Profile with name and avatar
      const authUpdateData: any = { displayName: name.trim() };
      if (avatarUrl) {
        authUpdateData.photoURL = avatarUrl;
      }
      await updateProfile(user, authUpdateData);

      // Refresh the user state before redirecting
      await refreshUser();
      toast.success(t('onboarding.success'));
      router.push("/");
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
      toast.error(t('onboarding.error.update_failed'));
      setSaving(false);
      setIsUploadingAvatar(false);
    }
  };

  // Step 0: Terms Acceptance (if not accepted)
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsStep, setShowTermsStep] = useState(false);

  // Initialize name from user data and check consent
  useEffect(() => {
    if (user) {
      if (user.displayName) {
        setName(user.displayName);
      }
      // Check for consent
      // We need to check if the user has already accepted the terms.
      // The user object from useAuth might be the Firebase Auth user, which doesn't have the custom 'consent' field directly on it unless we merged it or fetched it.
      // However, on page load we don't have the full Firestore document in 'user' usually unless the context provides it.
      // The 'useAuth' context seems to provide 'user' which is User | null.
      // We might need to fetch the user doc here or rely on the fact that AuthContext likely merges custom claims or we need to fetch it.
      // Let's look at how 'refreshUser' or 'user' is provided.
      // Assuming 'user' from context might NOT have 'consent' field if it is just Firebase User.
      // But the context often provides a way to get it.
      // Let's assume for safety we can check the firestore doc or use a service helper if available, BUT
      // looking at 'useAuth', it seems it exposes 'user' which is likely the Firebase Auth user.
      // Let's check the AuthService.getUserData usage or similar.
      // Actually, let's fetch the user data to be sure.

      const checkConsent = async () => {
        try {
          // We can check if we need to fetch from Firestore
          // For now, let's assuming we force checking.
          // But wait, the previous code didn't fetch user doc in useEffect explicitly for name, it used 'user.displayName'.
          // Let's modify this to fetch the latest user data including consent.
          if (user.uid) {
            const docRef = doc(db, "users", user.uid);
            // We can use onSnapshot or getDoc. getDoc is fine for one-time check.
            // But better to use getDoc here.
            // Import getDoc is already there.
            import("firebase/firestore").then(async ({ getDoc }) => {
              const snapshot = await getDoc(docRef);
              if (snapshot.exists()) {
                const userData = snapshot.data();
                // Pre-fill name if it exists in Firestore (useful for email signups)
                if (userData.name && !name) {
                  setName(userData.name);
                }
                // Check if consent is missing or incomplete
                if (!userData.consent?.privacyAccepted || !userData.consent?.legalAccepted) {
                  setShowTermsStep(true);
                }
              }
            });
          }
        } catch (e) {
          console.error("Error checking consent", e);
        }
      };
      checkConsent();

    }
  }, [user]);

  // Step 2... (rest of existing code)

  const handleTermsContinue = async () => {
    if (!acceptedTerms) {
      toast.error(t('signup.error_terms_required'));
      return;
    }

    if (!user) return;
    setSaving(true);

    try {
      const consent = {
        privacyAccepted: true,
        legalAccepted: true,
        acceptedAt: {
          seconds: Math.floor(Date.now() / 1000),
          nanoseconds: 0,
        },
      };

      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { consent });

      // Use set to merge if update fails? No, user should exist.

      setShowTermsStep(false);
      setSaving(false);
    } catch (error) {
      console.error("Error saving consent:", error);
      toast.error(t('onboarding.error.update_failed'));
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const result = await softDeleteUserAccount(user.uid);

      if (result.success) {
        toast.success(t('onboarding.account_deleted'));
        router.push("/login");
      } else {
        console.error("Error deleting account:", result.error);
        await AuthService.logout();
        router.push("/login");
      }
    } catch (error: any) {
      console.error("Error during cancellation:", error);
      await AuthService.logout();
      router.push("/login");
    } finally {
      setSaving(false);
    }
  };

  const handleEnterManually = () => {
    setShowManualInput(true);
    clearError();
  };

  return (
    <OrganicBackground className="justify-center">
      <Card className="w-full max-w-2xl shadow-xl border-gray-100 dark:border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <CardTitle className="text-2xl font-display text-foreground ">{t('onboarding.welcome')}</CardTitle>
            <span className="text-sm text-gray-500">
              {showTermsStep ? t('onboarding.step_terms') : t('onboarding.step_indicator', { current: currentStep, total: 2 })}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-serif">
            {showTermsStep ? t('onboarding.terms_description') : (currentStep === 1 ? t('onboarding.profile_step_description') : t('onboarding.location_step_description'))}
          </p>
        </CardHeader>

        <CardContent>
          {showTermsStep ? (
            // Step 0: Terms Acceptance
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary rounded-lg shadow-md">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-foreground font-display">
                  {t('onboarding.terms_title')}
                </h2>
              </div>

              <div className="flex items-start space-x-2 pt-2 border p-4 rounded-lg bg-background/50">
                <Checkbox
                  id="terms-onboarding"
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                  className="mt-1"
                />
                <Label htmlFor="terms-onboarding" className="text-sm text-foreground leading-relaxed cursor-pointer block">
                  {t('signup.terms_consent_prefix')}{' '}
                  <Link href="/privacy" className="text-primary hover:underline font-semibold" target="_blank">
                    {t('signup.privacy_policy')}
                  </Link>
                  {' '}{t('signup.terms_consent_and')}{' '}
                  <Link href="/legal" className="text-primary hover:underline font-semibold" target="_blank">
                    {t('signup.legal_notice')}
                  </Link>
                  .
                  <span className="block mt-1 text-muted-foreground">
                    {t('signup.notifications_consent')}
                  </span>
                </Label>
              </div>

              <Button
                onClick={handleTermsContinue}
                className="w-full bg-primary hover:bg-[#7a8578] text-white shadow-lg"
                size="lg"
                disabled={!acceptedTerms || saving}
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {t('common.continue')}
              </Button>

              <Button
                onClick={handleCancel}
                variant="ghost"
                className="w-full text-muted-foreground hover:text-destructive mt-2"
                size="lg"
                disabled={saving}
              >
                <LogOut className="w-4 h-4 mr-2" />
                {t('onboarding.cancel_button')}
              </Button>
            </div>
          ) : currentStep === 1 ? (
            // Step 1: Profile Information
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary rounded-lg shadow-md">
                  <User className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-foreground font-display">
                  {t('onboarding.profile_step_title')}
                </h2>
              </div>

              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-base font-semibold">
                  {t('onboarding.name_label')} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('onboarding.name_placeholder')}
                  className="text-base"
                  maxLength={100}
                />
              </div>

              {/* Avatar Upload */}
              <div className="flex flex-col items-center gap-4">
                <Label className="text-base font-semibold">
                  {t('onboarding.avatar_label')}
                </Label>
                <div className="relative group">
                  <Avatar className="h-32 w-32 border-4 border-white dark:border-gray-700 shadow-xl ring-4 ring-[#A6C6B9] dark:ring-[#4A5D54]">
                    <AvatarImage src={avatarPreview || undefined} alt="Preview" className="object-cover" />
                    <AvatarFallback className="text-4xl font-bold bg-primary text-white">
                      {name
                        ? name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                        : user?.displayName
                          ? user.displayName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                          : "?"}
                    </AvatarFallback>
                  </Avatar>

                  <div
                    className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="w-8 h-8 text-white" />
                  </div>

                  <Input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleAvatarChange}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  {t('profile.avatar_requirements')}
                </p>
              </div>

              {/* Bio Field */}
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-base font-semibold">
                  {t('onboarding.bio_label')} <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder={t('onboarding.bio_placeholder')}
                  className="resize-none min-h-[120px]"
                  maxLength={500}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{t('onboarding.bio_help')}</span>
                  <span>{bio.length}/500</span>
                </div>
              </div>

              {/* Continue Button */}
              <Button
                onClick={handleStep1Continue}
                className="w-full bg-primary hover:bg-[#7a8578] text-white shadow-lg"
                size="lg"
              >
                {t('onboarding.next_button')}
              </Button>
            </div>
          ) : (
            // Step 2: Location
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-secondary dark:bg-secondary rounded-lg shadow-md">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-foreground font-display">
                  {t('onboarding.location_step_title')}
                </h2>
              </div>

              <p className="text-center text-gray-600 dark:text-gray-400 font-serif">
                {t('onboarding.description')}
              </p>

              {!showManualInput ? (
                <>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      onClick={handleLocation}
                      disabled={geoLoading || saving || isUploadingAvatar}
                      className="bg-primary hover:bg-[#7a8578] text-white"
                    >
                      {(geoLoading || saving || isUploadingAvatar) ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t('onboarding.loading_button')}
                        </>
                      ) : (
                        <>
                          <MapPin className="mr-2 h-4 w-4" />
                          {t('onboarding.share_location_button')}
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleEnterManually}
                      variant="outline"
                      disabled={geoLoading || saving || isUploadingAvatar}
                    >
                      {t('onboarding.enter_manually_button')}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
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
                    disabled={saving || isUploadingAvatar}
                  >
                    {t('common.back')}
                  </Button>
                </div>
              )}

              {geoError && <p className="text-red-500 text-sm mt-4 text-center">{geoError}</p>}

              {/* Back to Step 1 */}
              <Button
                onClick={() => setCurrentStep(1)}
                variant="ghost"
                className="w-full"
                disabled={saving || isUploadingAvatar}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('onboarding.back_to_profile')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </OrganicBackground>
  );
}
