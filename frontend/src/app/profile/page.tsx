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
import { TomatoRating } from "@/components/shared/TomatoRating";
import {
  User,
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
} from "lucide-react";

interface UserData {
  name: string;
  email: string;
  avatarUrl: string;
  bio?: string;
  location?: {
    latitude: number;
    longitude: number;
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
  <div className="animate-pulse">
    <div className="flex flex-col items-center space-y-4">
      <div className="h-32 w-32 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-full"></div>
      <div className="space-y-2">
        <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-48 mx-auto"></div>
        <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-32 mx-auto"></div>
      </div>
    </div>
  </div>
);

// Profile section component
const ProfileSection = ({ title, icon: Icon, children }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) => (
  <Card className="p-6">
    <div className="flex items-center gap-2 mb-4">
      <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
    </div>
    {children}
  </Card>
);

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [newBio, setNewBio] = useState("");
  const [showEmail, setShowEmail] = useState(false);
  
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
    }
  };

  const handlePasswordChange = () => {
    const auth = getAuth();
    if (auth.currentUser && auth.currentUser.email) {
      sendPasswordResetEmail(auth, auth.currentUser.email)
        .then(() => {
          alert("Password reset email sent! Check your inbox.");
        })
        .catch((error) => {
          alert(error.message);
        });
    } else {
      alert(
        "Could not send password reset email. User not found or email is missing."
      );
    }
  };

  const handleDeleteAccount = async () => {
    if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      // Implementation would go here
      alert("Account deletion would be implemented here");
    }
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <ProfileSkeleton />
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
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              My Profile
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your personal information and preferences
            </p>
          </div>
        </div>

        {/* Profile Information Section */}
        <ProfileSection title="Personal Information" icon={User}>
          <div className="space-y-6">
            {/* Avatar and basic info */}
            <div className="flex items-start gap-6">
              <Avatar className="h-24 w-24 border-4 border-gray-200 dark:border-gray-700">
                <AvatarImage src={userData.avatarUrl} alt={userData.name} />
                <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-blue-400 to-blue-500 text-white">
                  {userData.name
                    ? userData.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                    : ""}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-4">
                {isEditing ? (
                  <>
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="mt-1"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={newBio}
                        onChange={(e) => setNewBio(e.target.value)}
                        placeholder="Tell us about yourself and your garden..."
                        className="mt-1 resize-none"
                        rows={4}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {userData.name}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 mt-2">
                        {userData.bio || "No bio added yet"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Member since {memberSince}
                      </Badge>
                      {userData.location && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          Location verified
                        </Badge>
                      )}
                      {userData.reputation && userData.reputation.totalReviews > 0 && (
                        <div className="flex items-center gap-2">
                          <TomatoRating 
                            rating={userData.reputation.averageRating} 
                            size="sm" 
                            showNumber={true}
                          />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            ({userData.reputation.totalReviews} reviews)
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Email display */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Email:</span>
                  {showEmail ? (
                    <span className="text-sm font-medium">{userData.email}</span>
                  ) : (
                    <span className="text-sm font-medium">••••••••••</span>
                  )}
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

            {/* Action buttons */}
            <div className="flex gap-3">
              {isEditing ? (
                <>
                  <Button onClick={handleSave}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </ProfileSection>

        {/* Reputation & Gamification Section */}
        {userData.reputation && (
          <ProfileSection title="Reputation & Achievements" icon={Trophy}>
            <div className="space-y-4">
              {/* Rating Overview */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 rounded-lg">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    Your Rating
                  </h3>
                  {userData.reputation.totalReviews > 0 ? (
                    <div className="flex items-center gap-3">
                      <TomatoRating 
                        rating={userData.reputation.averageRating} 
                        size="lg" 
                        showNumber={true}
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Based on {userData.reputation.totalReviews} review{userData.reputation.totalReviews !== 1 ? 's' : ''}
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      No reviews yet. Complete your first exchange to get started!
                    </p>
                  )}
                </div>
              </div>

              {/* Points & Level */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h4 className="font-medium">Points</h4>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {userData.points || 0}
                  </p>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <h4 className="font-medium">Level</h4>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {getLevelName(userData.level || 0)}
                  </p>
                </div>
              </div>

              {/* Badges (placeholder for now) */}
              {userData.badges && userData.badges.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Badges Earned</h4>
                  <div className="flex flex-wrap gap-2">
                    {userData.badges.map((badge) => (
                      <Badge key={badge} variant="secondary">
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
        <ProfileSection title="Notification Preferences" icon={Bell}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notif">Email Notifications</Label>
                <p className="text-sm text-gray-500">Receive updates via email</p>
              </div>
              <Checkbox
                id="email-notif"
                checked={emailNotifications}
                onCheckedChange={(checked) => setEmailNotifications(checked as boolean)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="message-notif" className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  New Messages
                </Label>
                <p className="text-sm text-gray-500">When someone sends you a message</p>
              </div>
              <Checkbox
                id="message-notif"
                checked={messageNotifications}
                onCheckedChange={(checked) => setMessageNotifications(checked as boolean)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="exchange-notif" className="flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4" />
                  Exchange Updates
                </Label>
                <p className="text-sm text-gray-500">When exchange status changes</p>
              </div>
              <Checkbox
                id="exchange-notif"
                checked={exchangeNotifications}
                onCheckedChange={(checked) => setExchangeNotifications(checked as boolean)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="product-notif" className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Product Interest
                </Label>
                <p className="text-sm text-gray-500">When someone is interested in your products</p>
              </div>
              <Checkbox
                id="product-notif"
                checked={productNotifications}
                onCheckedChange={(checked) => setProductNotifications(checked as boolean)}
              />
            </div>
          </div>
        </ProfileSection>

        {/* Privacy Settings */}
        <ProfileSection title="Privacy Settings" icon={Shield}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="show-location">Show My Location</Label>
                <p className="text-sm text-gray-500">Display approximate location on your profile</p>
              </div>
              <Checkbox
                id="show-location"
                checked={showLocation}
                onCheckedChange={(checked) => setShowLocation(checked as boolean)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="public-profile">Public Profile</Label>
                <p className="text-sm text-gray-500">Allow non-registered users to view your profile</p>
              </div>
              <Checkbox
                id="public-profile"
                checked={publicProfile}
                onCheckedChange={(checked) => setPublicProfile(checked as boolean)}
              />
            </div>
          </div>
        </ProfileSection>

        {/* Account Management */}
        <ProfileSection title="Account Management" icon={Lock}>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                Password & Security
              </h3>
              <Button onClick={handlePasswordChange} variant="outline">
                <Lock className="mr-2 h-4 w-4" />
                Change Password
              </Button>
            </div>
            <Separator />
            <div>
              <h3 className="text-sm font-medium text-red-600 dark:text-red-400 mb-3">
                Danger Zone
              </h3>
              <p className="text-sm text-gray-500 mb-3">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <Button onClick={handleDeleteAccount} variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Account
              </Button>
            </div>
          </div>
        </ProfileSection>
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
