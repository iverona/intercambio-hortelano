"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { useI18n, useChangeLocale, useCurrentLocale } from "@/locales/provider";
import { toast } from "sonner";
import LocationSearchInput from "@/components/shared/LocationSearchInput";
import { useGeolocation } from "@/hooks/useGeolocation";
import {
  reauthenticateUser,
  softDeleteUserAccount,
  isGoogleSignInUser
} from "@/lib/accountDeletion";
import {
  User as UserIcon,
  Edit,
  Save,
  X,
  Mail,
  MapPin,
  Calendar,
  Eye,
  EyeOff,
  Trash2,
  Camera,
  Loader2,
  Languages,
} from "lucide-react";
import { TomatoRating } from "@/components/shared/TomatoRating";
import { useUser } from "@/hooks/useUser";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Loading skeleton component
const ProfileSkeleton = () => (
  <div className="animate-pulse space-y-6">
    <div className="h-48 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-2xl"></div>
    <div className="space-y-4">
      <div className="h-32 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-xl"></div>
      <div className="h-32 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-xl"></div>
    </div>
  </div>
);

// Profile section component
const ProfileSection = ({ title, icon: Icon, children, gradient }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  gradient?: string;
}) => (
  <Card className={`p-6 shadow-lg hover:shadow-xl transition-all duration-300 ${gradient || 'bg-white dark:bg-gray-800'}`}>
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-md">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h2>
    </div>
    {children}
  </Card>
);

export default function ProfilePage() {
  const t = useI18n();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Use custom hook
  const {
    userData,
    loading: userLoading,
    isUploading: isUploadingAvatar,
    updateProfileData,
    uploadAvatar,
    deleteAvatar
  } = useUser();

  const [isEditing, setIsEditing] = useState(false);

  // Local state for editing fields
  const [newName, setNewName] = useState("");
  const [newBio, setNewBio] = useState("");

  // Settings state
  const [showEmail, setShowEmail] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [exchangeNotifications, setExchangeNotifications] = useState(true);
  const [productNotifications, setProductNotifications] = useState(true);
  const [showLocation, setShowLocation] = useState(true);
  const [publicProfile, setPublicProfile] = useState(true);

  const [showLocationUpdate, setShowLocationUpdate] = useState(false);
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const { getCurrentLocation, loading: geoLoading, error: geoError, clearError } = useGeolocation();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Account deletion states
  const [showReauthDialog, setShowReauthDialog] = useState(false);
  const [reauthPassword, setReauthPassword] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [reauthError, setReauthError] = useState("");
  const [isGoogleUser, setIsGoogleUser] = useState(false);

  // Initialize state from userData
  useEffect(() => {
    if (userData) {
      setNewName(userData.name);
      setNewBio(userData.bio || "");

      if (userData.notifications) {
        setEmailNotifications(userData.notifications.email ?? true);
        setMessageNotifications(userData.notifications.messages ?? true);
        setExchangeNotifications(userData.notifications.exchanges ?? true);
        setProductNotifications(userData.notifications.products ?? true);
      }

      if (userData.privacy) {
        setShowLocation(userData.privacy.showLocation ?? true);
        setPublicProfile(userData.privacy.publicProfile ?? true);
      }
    }
  }, [userData]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }

    if (user) {
      setIsGoogleUser(isGoogleSignInUser());
    }
  }, [user, authLoading, router]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('profile.avatar_error_size'));
      return;
    }

    try {
      await uploadAvatar(file);
      toast.success(t('profile.save_button'));
    } catch (error) {
      toast.error(t('profile.upload_error'));
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveAvatar = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteAvatar();
      toast.success(t('profile.delete_photo_success'));
    } catch (error) {
      toast.error(t('profile.delete_photo_error'));
    }
  };

  const handleSave = async () => {
    try {
      await updateProfileData({
        name: newName,
        bio: newBio,
        notifications: {
          email: emailNotifications,
          messages: messageNotifications,
          exchanges: exchangeNotifications,
          products: productNotifications,
        },
        privacy: {
          showLocation,
          publicProfile,
        }
      });
      setIsEditing(false);
      toast.success(t('profile.save_button'));
    } catch (error) {
      toast.error(t('profile.save_error'));
    }
  };

  const handleLocationUpdate = async (locationData: { latitude: number; longitude: number; geohash?: string; address?: string }) => {
    setUpdatingLocation(true);
    try {
      await updateProfileData({
        location: {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
        },
        geohash: locationData.geohash,
        address: locationData.address || userData?.address,
        locationUpdatedAt: {
          seconds: Date.now() / 1000,
          nanoseconds: 0,
        }
      });

      setShowLocationUpdate(false);
      toast.success(t('profile.location_updated'));
    } catch (error) {
      toast.error(t('profile.location_update_failed'));
    } finally {
      setUpdatingLocation(false);
    }
  };

  const handlePasswordChange = () => {
    const auth = getAuth();
    if (auth.currentUser && auth.currentUser.email) {
      sendPasswordResetEmail(auth, auth.currentUser.email)
        .then(() => {
          toast.success(t('profile.password_reset_sent'));
        })
        .catch((error) => {
          toast.error(t('profile.password_reset_error'));
        });
    } else {
      toast.error(t('profile.password_reset_error'));
    }
  };

  const handleDeleteAccount = async () => {
    setShowReauthDialog(true);
    setReauthError("");
    setReauthPassword("");
  };

  const handleReauthAndDelete = async () => {
    if (!user || !userData) return;

    setIsDeletingAccount(true);
    setReauthError("");

    try {
      const reauthResult = await reauthenticateUser(
        userData.email,
        isGoogleSignInUser() ? undefined : reauthPassword
      );

      if (!reauthResult.success) {
        setReauthError(reauthResult.error || t('profile.reauth_error'));
        setIsDeletingAccount(false);
        return;
      }

      const deleteResult = await softDeleteUserAccount(user.uid);

      if (!deleteResult.success) {
        setReauthError(deleteResult.error || t('profile.delete_error'));
        setIsDeletingAccount(false);
        return;
      }

      setShowReauthDialog(false);
      toast.success(t('profile.delete_success'));

      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (error: any) {
      console.error("Error during account deletion:", error);
      setReauthError(error.message || t('profile.delete_error'));
      setIsDeletingAccount(false);
    }
  };

  const LanguageSelector = () => {
    const changeLocale = useChangeLocale();
    const currentLocale = useCurrentLocale();

    const handleLocaleChange = (newLocale: string) => {
      changeLocale(newLocale as "en" | "es");
      // Optionally save to user preferences in Firestore
      updateProfileData({ preferredLocale: newLocale });
      toast.success(t('profile.language_updated'));
    };

    return (
      <Tabs value={currentLocale} onValueChange={handleLocaleChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="en">{t('profile.language_english')}</TabsTrigger>
          <TabsTrigger value="es">{t('profile.language_spanish')}</TabsTrigger>
        </TabsList>
      </Tabs>
    );
  };

  if (authLoading || userLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <ProfileSkeleton />
          </div>
        </div>
      </main>
    );
  }

  if (!user || !userData) {
    return null;
  }

  const memberSince = userData.joinedDate
    ? new Date(userData.joinedDate.seconds * 1000).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Recently';

  const showAvatar = !!userData.avatarUrl;

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/20 dark:via-emerald-950/20 dark:to-teal-950/20 border-b">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-1/2 w-80 h-80 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg">
                <UserIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
                  {t('profile.title')}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {t('profile.subtitle')}
                </p>
              </div>
            </div>

            {/* Profile Card in Header */}
            <Card className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-2xl">
              <div className="flex items-start gap-6">
                <div className="relative group">
                  <Avatar className="h-28 w-28 border-4 border-white dark:border-gray-700 shadow-xl ring-4 ring-green-100 dark:ring-green-900">
                    <AvatarImage src={userData.avatarUrl || undefined} alt={userData.name} className="object-cover" />
                    <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-green-500 to-emerald-500 text-white">
                      {userData.name
                        ? userData.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                        : ""}
                    </AvatarFallback>
                  </Avatar>

                  {/* Always enable editing by clicking or hovering */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                    onClick={() => !isUploadingAvatar && fileInputRef.current?.click()}
                  >
                    {isUploadingAvatar ? (
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    ) : (
                      <Camera className="w-8 h-8 text-white" />
                    )}
                  </div>

                  {showAvatar && !isUploadingAvatar && (
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full shadow-lg z-20 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={handleRemoveAvatar}
                      title={t('profile.delete_photo')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}

                  <Input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleAvatarChange}
                  />
                </div>

                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {userData.name}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {userData.bio || t('profile.no_bio')}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-md">
                      <Calendar className="w-3 h-3 mr-1" />
                      {t('profile.member_since', { date: memberSince })}
                    </Badge>
                    {userData.location && (
                      <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-md">
                        <MapPin className="w-3 h-3 mr-1" />
                        {t('profile.location_verified')}
                      </Badge>
                    )}
                    {userData.reputation && userData.reputation.totalReviews > 0 && (
                      <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 rounded-full">
                        <TomatoRating
                          rating={userData.reputation.averageRating}
                          size="sm"
                          showNumber={true}
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {t('profile.reviews', { count: userData.reputation.totalReviews })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Personal Information Section */}
          <ProfileSection title={t('profile.personal_info')} icon={UserIcon}>
            <div className="space-y-6">
              {isEditing ? (
                <>
                  <div>
                    <Label htmlFor="name" className="text-base font-semibold mb-2 block">
                      {t('profile.name_label')}
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="mt-1"
                      placeholder={t('profile.name_placeholder')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bio" className="text-base font-semibold mb-2 block">
                      {t('profile.bio_label')}
                    </Label>
                    <Textarea
                      id="bio"
                      value={newBio}
                      onChange={(e) => setNewBio(e.target.value)}
                      placeholder={t('profile.bio_placeholder')}
                      className="mt-1 resize-none"
                      rows={4}
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handleSave}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg"
                      size="lg"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {t('profile.save_button')}
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)} size="lg">
                      <X className="mr-2 h-4 w-4" />
                      {t('profile.cancel_button')}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {/* Email display */}
                  <Card className="p-4 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                          <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400 block">{t('profile.email_label')}</span>
                          {showEmail ? (
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{userData.email}</span>
                          ) : (
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">••••••••••</span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowEmail(!showEmail)}
                      >
                        {showEmail ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </Card>

                  <Button
                    onClick={() => setIsEditing(true)}
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-lg"
                    size="lg"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    {t('profile.edit_button')}
                  </Button>
                </>
              )}
            </div>
          </ProfileSection>

          {/* Location Settings Section */}
          <ProfileSection title={t('profile.location_settings')} icon={MapPin}>
            <div className="space-y-4">
              {/* Current Location Display */}
              <Card className="p-4 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                      <MapPin className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 block">{t('profile.current_location')}</span>
                      {userData?.address ? (
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{userData.address}</span>
                      ) : userData?.location ? (
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {t('profile.location_coordinates', {
                            lat: userData.location.latitude.toFixed(4),
                            lng: userData.location.longitude.toFixed(4)
                          })}
                        </span>
                      ) : (
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          {t('profile.no_location_set')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {userData?.locationUpdatedAt && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {t('profile.location_last_updated', {
                      date: new Date(userData.locationUpdatedAt.seconds * 1000).toLocaleDateString()
                    })}
                  </p>
                )}
              </Card>

              {/* Update Location Options */}
              {!showLocationUpdate ? (
                <div className="flex gap-3">
                  <Button
                    onClick={async () => {
                      clearError();
                      const locationData = await getCurrentLocation();
                      if (locationData) {
                        handleLocationUpdate({
                          latitude: locationData.latitude,
                          longitude: locationData.longitude,
                          geohash: locationData.geohash
                        });
                      }
                    }}
                    disabled={geoLoading || updatingLocation}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    {geoLoading || updatingLocation ? t('profile.updating_location') : t('profile.use_current_location')}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowLocationUpdate(true);
                      clearError();
                    }}
                    variant="outline"
                    disabled={updatingLocation}
                  >
                    {t('profile.enter_location_manually')}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('profile.manual_location_description')}
                  </p>
                  <LocationSearchInput
                    onLocationSelect={(location) => {
                      handleLocationUpdate({
                        latitude: location.latitude,
                        longitude: location.longitude,
                        geohash: location.geohash,
                        address: location.address
                      });
                    }}
                    placeholder={t('profile.location_search_placeholder')}
                    className="w-full"
                  />
                  <Button
                    onClick={() => {
                      setShowLocationUpdate(false);
                      clearError();
                    }}
                    variant="outline"
                    className="w-full"
                    disabled={updatingLocation}
                  >
                    {t('onboarding.back_button')}
                  </Button>
                </div>
              )}
            </div>
          </ProfileSection>

          {/* Language Settings Section */}
          <ProfileSection title={t('profile.section_language')} icon={Languages}>
            <LanguageSelector />
          </ProfileSection>

          {/* Account Deletion Section */}
          <ProfileSection title={t('profile.section_danger_zone')} icon={Trash2} gradient="bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900">
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('profile.delete_account_description')}
              </p>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                className="w-full sm:w-auto"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t('profile.delete_account_button')}
              </Button>
            </div>
          </ProfileSection>
        </div>
      </div>

      {/* Reauthentication & Delete Dialog */}
      <Dialog open={showReauthDialog} onOpenChange={setShowReauthDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('profile.delete_account_title')}</DialogTitle>
            <DialogDescription>
              {t('profile.delete_account_confirmation')}
            </DialogDescription>
          </DialogHeader>

          {!isGoogleUser && (
            <div className="py-4">
              <Label htmlFor="password">{t('profile.password_label')}</Label>
              <Input
                id="password"
                type="password"
                value={reauthPassword}
                onChange={(e) => setReauthPassword(e.target.value)}
                placeholder={t('profile.password_placeholder')}
                className="mt-2"
              />
            </div>
          )}

          {reauthError && (
            <div className="text-red-500 text-sm py-2">
              {reauthError}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReauthDialog(false)}>
              {t('profile.cancel_button')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleReauthAndDelete}
              disabled={isDeletingAccount || (!isGoogleUser && !reauthPassword)}
            >
              {isDeletingAccount ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('profile.deleting_button')}
                </>
              ) : (
                t('profile.confirm_delete_button')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
