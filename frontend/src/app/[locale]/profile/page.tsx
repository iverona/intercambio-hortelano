"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { getAuth, sendPasswordResetEmail, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
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
import { fuzzLocation, getApproximateAddress } from "@/lib/locationUtils";
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
  LogOut,
  ShieldCheck,
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
import { OrganicBackground } from "@/components/shared/OrganicBackground";
import { OrganicCard } from "@/components/shared/OrganicCard";
import { Checkbox } from "@/components/ui/checkbox";

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
  <Card className={`p-6 shadow-lg hover:shadow-xl transition-all duration-300 ${gradient || 'bg-card border-gray-100 dark:border-gray-700'}`}>
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2 bg-primary rounded-lg shadow-md">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <h2 className="text-xl font-bold text-foreground ">{title}</h2>
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
      toast.success(t('common.save_changes'));
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
      toast.success(t('common.save_changes'));
    } catch (error) {
      toast.error(t('profile.save_error'));
    }
  };

  const handleLocationUpdate = async (locationData: { latitude: number; longitude: number; geohash?: string; address?: string }) => {
    setUpdatingLocation(true);
    try {
      // Fuzz the location before saving to protect privacy
      const fuzzedCoords = fuzzLocation(locationData.latitude, locationData.longitude);

      const updatePayload: any = {
        location: {
          latitude: fuzzedCoords.latitude,
          longitude: fuzzedCoords.longitude,
        },
        geohash: locationData.geohash,
        locationUpdatedAt: {
          seconds: Date.now() / 1000,
          nanoseconds: 0,
        }
      };

      // Generalize address if provided
      if (locationData.address) {
        updatePayload.address = getApproximateAddress(locationData.address);
      }

      await updateProfileData(updatePayload);

      setShowLocationUpdate(false);
      toast.success(t('profile.location_updated'));
    } catch (error) {
      toast.error(t('profile.location_update_failed'));
    } finally {
      setUpdatingLocation(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/");
      toast.success(t('header.logout'));
    } catch (error) {
      toast.error(t('profile.save_error'));
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
        user.email!,
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
      <OrganicBackground className="">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <ProfileSkeleton />
          </div>
        </div>
      </OrganicBackground>
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
    <OrganicBackground className="pb-20 md:pb-0">

      {/* Header Content */}
      <div className="w-full max-w-4xl px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-primary rounded-xl shadow-lg transform -rotate-2">
            <UserIcon className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold font-display text-foreground ">
              {t('profile.title')}
            </h1>
            <p className="text-muted-foreground mt-1 font-serif">
              {t('profile.subtitle')}
            </p>
          </div>
        </div>

        {/* Profile Card */}
        <OrganicCard className="mb-10" rotate={-1}>
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 w-full">
            <div className="relative group">
              <Avatar className="h-32 w-32 border-4 border-white dark:border-gray-700 shadow-xl">
                <AvatarImage src={userData.avatarUrl || undefined} alt={userData.name} className="object-cover" />
                <AvatarFallback className="text-3xl font-bold bg-primary text-white">
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

            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl font-bold text-foreground mb-2 font-display">
                {userData.name}
              </h2>
              <p className="text-muted-foreground mb-4 font-serif">
                {userData.bio || t('profile.no_bio')}
              </p>

              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                <Badge className="bg-primary text-white hover:bg-[#7a8578] border-0 shadow-sm">
                  <Calendar className="w-3 h-3 mr-1" />
                  {t('profile.member_since', { date: memberSince })}
                </Badge>
                {userData.location && (
                  <Badge className="bg-muted text-foreground hover:bg-[#95b5a8] border-0 shadow-sm">
                    <MapPin className="w-3 h-3 mr-1" />
                    {t('profile.location_verified')}
                  </Badge>
                )}
                {userData.reputation && userData.reputation.totalReviews > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-secondary/20 dark:bg-secondary/20 rounded-full">
                    <TomatoRating
                      rating={userData.reputation.averageRating}
                      size="sm"
                      showNumber={true}
                    />
                    <span className="text-sm text-muted-foreground ">
                      {t('profile.reviews', { count: userData.reputation.totalReviews })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </OrganicCard>

        {/* Sections */}
        <div className="space-y-8 w-full">
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
                      className="bg-primary hover:bg-[#7a8578] text-white shadow-lg"
                      size="lg"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {t('common.save_changes')}
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)} size="lg">
                      <X className="mr-2 h-4 w-4" />
                      {t('common.cancel')}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {/* Email display */}
                  <div className="p-4 bg-card border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded-lg">
                          <Mail className="w-4 h-4 text-foreground dark:text-card-foreground" />
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground block">{t('common.email')}</span>
                          {showEmail ? (
                            <span className="text-sm font-medium text-foreground ">{user?.email}</span>
                          ) : (
                            <span className="text-sm font-medium text-foreground ">••••••••••</span>
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
                  </div>

                  <Button
                    onClick={() => setIsEditing(true)}
                    className="bg-secondary hover:bg-[#8f7477] text-white shadow-lg"
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
              <div className="p-4 bg-card border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <MapPin className="w-4 h-4 text-foreground dark:text-card-foreground" />
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground block">{t('profile.current_location')}</span>
                      {userData?.address ? (
                        <span className="text-sm font-medium text-foreground ">{userData.address}</span>
                      ) : userData?.location ? (
                        <span className="text-sm font-medium text-foreground ">
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
                  <p className="text-xs text-muted-foreground/70 mt-2">
                    {t('profile.location_last_updated', {
                      date: new Date(userData.locationUpdatedAt.seconds * 1000).toLocaleDateString()
                    })}
                  </p>
                )}
              </div>

              {/* Update Location Options */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex gap-3 text-sm text-blue-800 dark:text-blue-300 mb-4">
                <ShieldCheck className="w-5 h-5 flex-shrink-0" />
                <p>{t('privacy.location_notice')}</p>
              </div>

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
                    className="bg-primary hover:bg-[#7a8578] text-white"
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
                  <p className="text-sm text-muted-foreground ">
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
                    {t('common.back')}
                  </Button>
                </div>
              )}
            </div>
          </ProfileSection>

          {/* Notification Settings Section */}
          <ProfileSection title={t('profile.notification_prefs')} icon={ShieldCheck}>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-card border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifs" className="text-base font-semibold">
                    {t('profile.email_notifs')}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t('profile.email_notifs_desc')}
                  </p>
                </div>
                <Checkbox
                  id="email-notifs"
                  checked={emailNotifications}
                  onCheckedChange={(checked) => {
                    setEmailNotifications(checked === true);
                    if (isEditing) handleSave(); // Auto-save if not in explicit edit mode? 
                    // Wait, the current page has an 'Edit' button for Personal Info, 
                    // but other sections like Location/Language save immediately.
                    // I'll follow the pattern of immediate save for settings.
                    updateProfileData({
                      notifications: {
                        email: checked === true,
                        messages: messageNotifications,
                        exchanges: exchangeNotifications,
                        products: productNotifications,
                      }
                    });
                  }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 bg-card border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="space-y-0.5">
                    <Label htmlFor="message-notifs" className="text-sm font-medium">
                      {t('profile.new_messages_notifs')}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {t('profile.new_messages_notifs_desc')}
                    </p>
                  </div>
                  <Checkbox
                    id="message-notifs"
                    checked={messageNotifications}
                    disabled={!emailNotifications}
                    onCheckedChange={(checked) => {
                      setMessageNotifications(checked === true);
                      updateProfileData({
                        notifications: {
                          email: emailNotifications,
                          messages: checked === true,
                          exchanges: exchangeNotifications,
                          products: productNotifications,
                        }
                      });
                    }}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-card border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="space-y-0.5">
                    <Label htmlFor="exchange-notifs" className="text-sm font-medium">
                      {t('profile.exchange_updates_notifs')}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {t('profile.exchange_updates_notifs_desc')}
                    </p>
                  </div>
                  <Checkbox
                    id="exchange-notifs"
                    checked={exchangeNotifications}
                    disabled={!emailNotifications}
                    onCheckedChange={(checked) => {
                      setExchangeNotifications(checked === true);
                      updateProfileData({
                        notifications: {
                          email: emailNotifications,
                          messages: messageNotifications,
                          exchanges: checked === true,
                          products: productNotifications,
                        }
                      });
                    }}
                  />
                </div>
              </div>
            </div>
          </ProfileSection>

          {/* Language Settings Section */}
          <ProfileSection title={t('profile.section_language')} icon={Languages}>
            <LanguageSelector />
          </ProfileSection>

          {/* Account Deletion Section */}
          <ProfileSection title={t('profile.section_danger_zone')} icon={Trash2} gradient="bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground ">
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

          {/* Logout Section - Specifically for mobile reachability */}
          <div className="pt-4 pb-12">
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-3 py-7 border-2 border-red-100 dark:border-red-900/30 text-red-600 hover:bg-red-600 hover:text-white transition-all duration-300 font-bold text-lg rounded-2xl shadow-sm hover:shadow-md active:scale-[0.98]"
            >
              <LogOut className="w-6 h-6" />
              {t('header.logout')}
            </Button>
          </div>
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
              <Label htmlFor="password">{t('common.password')}</Label>
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
              {t('common.cancel')}
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
    </OrganicBackground>
  );
}
