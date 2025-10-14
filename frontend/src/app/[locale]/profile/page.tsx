"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TomatoRating } from "@/components/shared/TomatoRating";
import {
  User as UserIcon,
  Edit,
  Save,
  X,
  Mail,
  MapPin,
  Calendar,
  Shield,
  Bell,
  Lock,
  Eye,
  EyeOff,
  MessageSquare,
  ArrowRightLeft,
  Package,
  Trash2,
  Star,
  Trophy,
  Award,
  Languages,
  Sparkles,
  CheckCircle,
} from "lucide-react";
import { useChangeLocale, useCurrentLocale, useI18n } from "@/locales/provider";
import { toast } from "sonner";
import LocationSearchInput from "@/components/shared/LocationSearchInput";
import { useGeolocation } from "@/hooks/useGeolocation";

interface UserData {
  name: string;
  email: string;
  avatarUrl: string;
  bio?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  geohash?: string;
  address?: string;
  locationUpdatedAt?: {
    seconds: number;
    nanoseconds: number;
  };
  joinedDate?: {
    seconds: number;
    nanoseconds: number;
  };
  notifications?: {
    email?: boolean;
    messages?: boolean;
    exchanges?: boolean;
    products?: boolean;
  };
  privacy?: {
    showLocation?: boolean;
    publicProfile?: boolean;
  };
  reputation?: {
    averageRating: number;
    totalReviews: number;
  };
  points?: number;
  level?: number;
  badges?: string[];
}

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
  const { user, loading } = useAuth();
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [newBio, setNewBio] = useState("");
  const [showEmail, setShowEmail] = useState(false);
  const [showLocationUpdate, setShowLocationUpdate] = useState(false);
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const { getCurrentLocation, loading: geoLoading, error: geoError, clearError } = useGeolocation();
  
  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [exchangeNotifications, setExchangeNotifications] = useState(true);
  const [productNotifications, setProductNotifications] = useState(true);
  
  // Privacy settings
  const [showLocation, setShowLocation] = useState(true);
  const [publicProfile, setPublicProfile] = useState(true);

  useEffect(() => {
    // Redirect to home if not authenticated
    if (!loading && !user) {
      router.push("/");
      return;
    }

    if (user) {
      const userRef = doc(db, "users", user.uid);
      getDoc(userRef).then((doc) => {
        if (doc.exists()) {
          const data = doc.data() as UserData;
          setUserData(data);
          setNewName(data.name);
          setNewBio(data.bio || "");
          
          // Load notification preferences
          if (data.notifications) {
            setEmailNotifications(data.notifications.email ?? true);
            setMessageNotifications(data.notifications.messages ?? true);
            setExchangeNotifications(data.notifications.exchanges ?? true);
            setProductNotifications(data.notifications.products ?? true);
          }
          
          // Load privacy preferences
          if (data.privacy) {
            setShowLocation(data.privacy.showLocation ?? true);
            setPublicProfile(data.privacy.publicProfile ?? true);
          }
        }
      });
    }
  }, [user, loading, router]);

  const handleSave = async () => {
    if (user) {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { 
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
      setUserData((prev) =>
        prev ? { 
          ...prev, 
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
        } : null
      );
      setIsEditing(false);
      toast.success(t('profile.save_button'));
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
    if (confirm(t('profile.confirm_delete'))) {
      toast.info(t('profile.delete_not_implemented'));
    }
  };

  // Show loading state while checking authentication
  if (loading) {
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

  // Don't render content if no user (will redirect)
  if (!user || !userData) {
    return null;
  }

  const memberSince = userData.joinedDate 
    ? new Date(userData.joinedDate.seconds * 1000).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Recently';

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
                <Avatar className="h-28 w-28 border-4 border-white dark:border-gray-700 shadow-xl ring-4 ring-green-100 dark:ring-green-900">
                  <AvatarImage src={userData.avatarUrl} alt={userData.name} />
                  <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-green-500 to-emerald-500 text-white">
                    {userData.name
                      ? userData.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                      : ""}
                  </AvatarFallback>
                </Avatar>
                
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
                      
                      if (locationData && user) {
                        setUpdatingLocation(true);
                        try {
                          const userRef = doc(db, "users", user.uid);
                          await updateDoc(userRef, {
                            location: {
                              latitude: locationData.latitude,
                              longitude: locationData.longitude,
                            },
                            geohash: locationData.geohash,
                            locationUpdatedAt: new Date(),
                          });
                          
                          // Update local state
                          setUserData(prev => prev ? {
                            ...prev,
                            location: {
                              latitude: locationData.latitude,
                              longitude: locationData.longitude,
                            },
                            geohash: locationData.geohash,
                            locationUpdatedAt: {
                              seconds: Date.now() / 1000,
                              nanoseconds: 0,
                            }
                          } : null);
                          
                          toast.success(t('profile.location_updated'));
                        } catch (error) {
                          toast.error(t('profile.location_update_failed'));
                        } finally {
                          setUpdatingLocation(false);
                        }
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
                    onLocationSelect={async (location) => {
                      if (user) {
                        setUpdatingLocation(true);
                        try {
                          const userRef = doc(db, "users", user.uid);
                          await updateDoc(userRef, {
                            location: {
                              latitude: location.latitude,
                              longitude: location.longitude,
                            },
                            geohash: location.geohash,
                            address: location.address,
                            locationUpdatedAt: new Date(),
                          });
                          
                          // Update local state
                          setUserData(prev => prev ? {
                            ...prev,
                            location: {
                              latitude: location.latitude,
                              longitude: location.longitude,
                            },
                            geohash: location.geohash,
                            address: location.address,
                            locationUpdatedAt: {
                              seconds: Date.now() / 1000,
                              nanoseconds: 0,
                            }
                          } : null);
                          
                          setShowLocationUpdate(false);
                          toast.success(t('profile.location_updated'));
                        } catch (error) {
                          toast.error(t('profile.location_update_failed'));
                        } finally {
                          setUpdatingLocation(false);
                        }
                      }
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

              {/* Error Display */}
              {geoError && (
                <p className="text-sm text-red-500 dark:text-red-400">{geoError}</p>
              )}

              {/* Privacy Note */}
              <Card className="p-3 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
                  <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {t('profile.location_privacy_note')}
                </p>
              </Card>
            </div>
          </ProfileSection>

          {/* Reputation & Gamification Section */}
          {userData.reputation && (
            <ProfileSection title={t('profile.reputation_achievements')} icon={Trophy}>
              <div className="space-y-4">
                {/* Rating Overview */}
                <Card className="p-6 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border-orange-200 dark:border-orange-800 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                        <Star className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        {t('profile.your_rating')}
                      </h3>
                      {userData.reputation.totalReviews > 0 ? (
                        <div className="flex items-center gap-4">
                          <TomatoRating 
                            rating={userData.reputation.averageRating} 
                            size="lg" 
                            showNumber={true}
                          />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {userData.reputation.totalReviews === 1
                              ? t('profile.based_on_reviews', { count: 1 })
                              : t('profile.based_on_reviews_plural', { count: userData.reputation.totalReviews })}
                          </span>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {t('profile.no_reviews')}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Points & Level */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800 shadow-lg hover:shadow-xl transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-md">
                        <Star className="w-5 h-5 text-white" />
                      </div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">{t('profile.points')}</h4>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                      {userData.points || 0}
                    </p>
                  </Card>
                  <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800 shadow-lg hover:shadow-xl transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-md">
                        <Award className="w-5 h-5 text-white" />
                      </div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">{t('profile.level')}</h4>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                      {getLevelName(userData.level || 0)}
                    </p>
                  </Card>
                </div>

                {/* Badges */}
                {userData.badges && userData.badges.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-yellow-500" />
                      {t('profile.badges_earned')}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {userData.badges.map((badge) => (
                        <Badge key={badge} className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white border-0 shadow-md">
                          {badge}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ProfileSection>
          )}

          {/* Notification Preferences */}
          <ProfileSection title={t('profile.notification_prefs')} icon={Bell}>
            <div className="space-y-4">
              <Card className="p-4 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notif" className="text-base font-semibold">
                      {t('profile.email_notifs')}
                    </Label>
                    <p className="text-sm text-gray-500">{t('profile.email_notifs_desc')}</p>
                  </div>
                  <Checkbox
                    id="email-notif"
                    checked={emailNotifications}
                    onCheckedChange={(checked) => setEmailNotifications(checked as boolean)}
                  />
                </div>
              </Card>
              <Separator />
              <div className="space-y-3">
                {[
                  { id: 'message-notif', icon: MessageSquare, label: t('profile.new_messages_notifs'), desc: t('profile.new_messages_notifs_desc'), checked: messageNotifications, onChange: setMessageNotifications },
                  { id: 'exchange-notif', icon: ArrowRightLeft, label: t('profile.exchange_updates_notifs'), desc: t('profile.exchange_updates_notifs_desc'), checked: exchangeNotifications, onChange: setExchangeNotifications },
                  { id: 'product-notif', icon: Package, label: t('profile.product_interest_notifs'), desc: t('profile.product_interest_notifs_desc'), checked: productNotifications, onChange: setProductNotifications },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex items-start gap-3 flex-1">
                      <item.icon className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
                      <div className="space-y-0.5">
                        <Label htmlFor={item.id} className="font-medium cursor-pointer">
                          {item.label}
                        </Label>
                        <p className="text-sm text-gray-500">{item.desc}</p>
                      </div>
                    </div>
                    <Checkbox
                      id={item.id}
                      checked={item.checked}
                      onCheckedChange={(checked) => item.onChange(checked as boolean)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </ProfileSection>

          {/* Language Settings */}
          <ProfileSection title={t('profile.language_settings')} icon={Languages}>
            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold mb-2 block">{t('profile.select_language')}</Label>
                <p className="text-sm text-gray-500 mb-4">{t('profile.select_language_desc')}</p>
                <LanguageSelector />
              </div>
            </div>
          </ProfileSection>

          {/* Privacy Settings */}
          <ProfileSection title={t('profile.privacy_settings')} icon={Shield}>
            <div className="space-y-4">
              {[
                { id: 'show-location', label: t('profile.show_location'), desc: t('profile.show_location_desc'), checked: showLocation, onChange: setShowLocation },
                { id: 'public-profile', label: t('profile.public_profile'), desc: t('profile.public_profile_desc'), checked: publicProfile, onChange: setPublicProfile },
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 border border-gray-200 dark:border-gray-700">
                  <div className="space-y-0.5">
                    <Label htmlFor={item.id} className="text-base font-semibold cursor-pointer">
                      {item.label}
                    </Label>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
                  <Checkbox
                    id={item.id}
                    checked={item.checked}
                    onCheckedChange={(checked) => item.onChange(checked as boolean)}
                  />
                </div>
              ))}
            </div>
          </ProfileSection>

          {/* Account Management */}
          <ProfileSection title={t('profile.account_management')} icon={Lock}>
            <div className="space-y-6">
              <Card className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  {t('profile.password_security')}
                </h3>
                <Button 
                  onClick={handlePasswordChange} 
                  variant="outline"
                  className="hover:bg-blue-100 dark:hover:bg-blue-900"
                >
                  <Lock className="mr-2 h-4 w-4" />
                  {t('profile.change_password')}
                </Button>
              </Card>
              
              <Separator />
              
              <Card className="p-5 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 border-red-200 dark:border-red-800">
                <h3 className="text-base font-semibold text-red-600 dark:text-red-400 mb-3 flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  {t('profile.danger_zone')}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {t('profile.delete_account_warning')}
                </p>
                <Button onClick={handleDeleteAccount} variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('profile.delete_account')}
                </Button>
              </Card>
            </div>
          </ProfileSection>
        </div>
      </div>
    </main>
  );
}

// Helper function to get level name
function getLevelName(level: number): string {
  const levels = [
    "Seed",
    "Sprout",
    "Gardener",
    "Harvester",
    "Master Grower"
  ];
  return levels[Math.min(level, levels.length - 1)] || "Seed";
}

// Language selector component
const LanguageSelector = () => {
  const changeLocale = useChangeLocale();
  const currentLocale = useCurrentLocale();

  return (
    <div className="flex gap-3">
      <Button
        variant={currentLocale === 'en' ? 'default' : 'outline'}
        onClick={() => changeLocale('en')}
        className={currentLocale === 'en' ? 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-lg' : ''}
        size="lg"
      >
        <CheckCircle className={`mr-2 h-4 w-4 ${currentLocale === 'en' ? '' : 'opacity-0'}`} />
        English
      </Button>
      <Button
        variant={currentLocale === 'es' ? 'default' : 'outline'}
        onClick={() => changeLocale('es')}
        className={currentLocale === 'es' ? 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-lg' : ''}
        size="lg"
      >
        <CheckCircle className={`mr-2 h-4 w-4 ${currentLocale === 'es' ? '' : 'opacity-0'}`} />
        Español
      </Button>
    </div>
  );
};
