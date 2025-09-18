"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ProductCard from "@/components/shared/ProductCard";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ChatList from "@/components/shared/ChatList";
import { createNotification } from "@/lib/notifications";
import {
  User,
  Package,
  MessageSquare,
  ArrowRightLeft,
  Edit,
  Save,
  X,
  Mail,
  MapPin,
  Calendar,
  Sparkles,
  Shield,
  Settings,
  Trash2,
  Check,
  Clock,
  AlertCircle,
  DollarSign
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  createdAt?: {
    seconds: number;
    nanoseconds: number;
  };
}

interface Exchange {
  id: string;
  productName: string;
  status: string;
  buyerId: string;
  sellerId: string;
  requesterId?: string;
  ownerId?: string;
  offer?: {
    type: "exchange" | "purchase" | "chat";
    offeredProductId?: string;
    offeredProductName?: string;
    amount?: number;
    message?: string;
  };
  createdAt?: {
    seconds: number;
    nanoseconds: number;
  };
}

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

// Product skeleton component
const ProductGridSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="animate-pulse">
        <div className="bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-xl h-64"></div>
      </div>
    ))}
  </div>
);

// Hero section for profile
const ProfileHero = ({ userData, isEditing, newName, newBio, setNewName, setNewBio, handleSave, setIsEditing, handlePasswordChange }: {
  userData: UserData;
  isEditing: boolean;
  newName: string;
  newBio: string;
  setNewName: (name: string) => void;
  setNewBio: (bio: string) => void;
  handleSave: () => void;
  setIsEditing: (editing: boolean) => void;
  handlePasswordChange: () => void;
}) => {
  const memberSince = userData.joinedDate 
    ? new Date(userData.joinedDate.seconds * 1000).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Recently';

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950 dark:via-emerald-950 dark:to-teal-950 rounded-2xl mb-8">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative px-8 py-12">
        <div className="flex flex-col items-center space-y-6">
          {/* Avatar with status ring */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full blur-lg opacity-50 animate-pulse"></div>
            <Avatar className="h-32 w-32 border-4 border-white dark:border-gray-800 shadow-xl relative">
              <AvatarImage src={userData.avatarUrl} alt={userData.name} />
              <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-green-400 to-emerald-500 text-white">
                {userData.name
                  ? userData.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                  : ""}
              </AvatarFallback>
            </Avatar>
            <div className="absolute bottom-2 right-2 h-6 w-6 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
          </div>

          {/* User info */}
          <div className="text-center max-w-2xl">
            {isEditing ? (
              <div className="space-y-4">
                <Input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="text-3xl font-bold text-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
                  placeholder="Your name"
                />
                <Textarea
                  value={newBio}
                  onChange={(e) => setNewBio(e.target.value)}
                  placeholder="Tell us a bit about yourself..."
                  className="text-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm resize-none"
                  rows={3}
                />
              </div>
            ) : (
              <>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
                  {userData.name}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
                  {userData.bio || "No bio yet. Click edit to add one!"}
                </p>
              </>
            )}

            {/* User badges */}
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {userData.email}
              </Badge>
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
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Verified Gardener
              </Badge>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 justify-center">
            {isEditing ? (
              <>
                <Button onClick={handleSave} className="group">
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)} className="group">
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => setIsEditing(true)} className="group">
                  <Edit className="mr-2 h-4 w-4 transition-transform group-hover:rotate-12" />
                  Edit Profile
                </Button>
                <Button variant="outline" onClick={handlePasswordChange} className="group">
                  <Settings className="mr-2 h-4 w-4 transition-transform group-hover:rotate-90" />
                  Change Password
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Stats card component
const StatsCard = ({ icon: Icon, label, value, color }: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: string;
}) => (
  <Card className="p-6 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
    <div className="flex items-center gap-4">
      <div className={`p-3 ${color} rounded-lg`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
      </div>
    </div>
  </Card>
);

// Empty state component
const EmptyState = ({ icon: Icon, title, description, action }: {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: React.ReactNode;
}) => (
  <Card className="p-12 text-center bg-gray-50/50 dark:bg-gray-900/50 border-dashed">
    <div className="flex flex-col items-center">
      <div className="relative">
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 rounded-full blur-xl opacity-30"></div>
        <Icon className="w-16 h-16 text-gray-400 dark:text-gray-600 relative z-10" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  </Card>
);

// Exchange card component
const ExchangeCard = ({ exchange, userId, onAccept, onReject }: {
  exchange: Exchange;
  userId: string;
  onAccept: () => void;
  onReject: () => void;
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'accepted':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <X className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'accepted':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getOfferTypeIcon = (type?: string) => {
    switch (type) {
      case 'exchange':
        return <ArrowRightLeft className="w-4 h-4 text-green-600" />;
      case 'purchase':
        return <DollarSign className="w-4 h-4 text-blue-600" />;
      case 'chat':
        return <MessageSquare className="w-4 h-4 text-purple-600" />;
      default:
        return <Package className="w-4 h-4 text-gray-600" />;
    }
  };

  const getOfferDescription = () => {
    if (!exchange.offer) return null;
    
    switch (exchange.offer.type) {
      case 'exchange':
        return exchange.offer.offeredProductName 
          ? `Offers: ${exchange.offer.offeredProductName}`
          : 'Proposes an exchange';
      case 'purchase':
        return exchange.offer.amount 
          ? `Offers: €${exchange.offer.amount.toFixed(2)}`
          : 'Wants to purchase';
      case 'chat':
        return 'Wants to discuss';
      default:
        return null;
    }
  };

  // Determine if this user is the owner (seller) or requester (buyer)
  const isOwner = userId === (exchange.ownerId || exchange.sellerId);
  const isRequester = userId === (exchange.requesterId || exchange.buyerId);

  return (
    <Card className="p-6 hover:shadow-lg transition-all duration-300">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {exchange.offer && getOfferTypeIcon(exchange.offer.type)}
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
              {isOwner ? 'Someone wants: ' : 'You requested: '}{exchange.productName}
            </h4>
          </div>
          
          {exchange.offer && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {getOfferDescription()}
            </p>
          )}
          
          {exchange.offer?.message && (
            <p className="text-sm text-gray-500 dark:text-gray-500 italic mb-2">
              &ldquo;{exchange.offer.message}&rdquo;
            </p>
          )}
          
          <div className="flex items-center gap-2">
            <Badge className={`${getStatusColor(exchange.status)} border-0 flex items-center gap-1`}>
              {getStatusIcon(exchange.status)}
              {exchange.status.charAt(0).toUpperCase() + exchange.status.slice(1)}
            </Badge>
            {exchange.createdAt && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(exchange.createdAt.seconds * 1000).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        
        {isOwner && exchange.status === "pending" && (
          <div className="flex gap-2">
            <Button
              onClick={onAccept}
              size="sm"
              className="bg-green-500 hover:bg-green-600"
            >
              <Check className="w-4 h-4 mr-1" />
              Accept
            </Button>
            <Button
              onClick={onReject}
              size="sm"
              variant="destructive"
            >
              <X className="w-4 h-4 mr-1" />
              Reject
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [newBio, setNewBio] = useState("");

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
        }
      });

      const productsQuery = query(
        collection(db, "products"),
        where("userId", "==", user.uid)
      );
      const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
        const productsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Product[];
        setProducts(productsData);
      });

      // Query for exchanges where user is either buyer/requester or seller/owner
      const exchangesAsBuyerQuery = query(
        collection(db, "exchanges"),
        where("buyerId", "==", user.uid)
      );
      
      const exchangesAsSellerQuery = query(
        collection(db, "exchanges"),
        where("sellerId", "==", user.uid)
      );

      // Subscribe to both queries
      const unsubscribeExchangesAsBuyer = onSnapshot(exchangesAsBuyerQuery, (snapshot) => {
        const buyerExchanges = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Exchange[];
        
        // Also get seller exchanges
        onSnapshot(exchangesAsSellerQuery, (snapshot2) => {
          const sellerExchanges = snapshot2.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Exchange[];
          
          // Combine and deduplicate
          const allExchanges = [...buyerExchanges, ...sellerExchanges];
          const uniqueExchanges = allExchanges.filter((exchange, index, self) =>
            index === self.findIndex((e) => e.id === exchange.id)
          );
          
          setExchanges(uniqueExchanges);
        });
      });

      return () => {
        unsubscribeProducts();
        unsubscribeExchangesAsBuyer();
      };
    }
  }, [user, loading, router]);

  const handleExchange = async (exchangeId: string, status: string) => {
    if (!user) return;
    
    try {
      const exchangeRef = doc(db, "exchanges", exchangeId);
      
      // First, get the exchange details to know who to notify
      const exchangeSnap = await getDoc(exchangeRef);
      if (!exchangeSnap.exists()) {
        console.error("Exchange not found");
        return;
      }
      
      const exchangeData = exchangeSnap.data() as Exchange;
      
      // Update the exchange status
      await updateDoc(exchangeRef, { status });
      
      // Determine the recipient (the person who made the offer)
      const recipientId = exchangeData.requesterId || exchangeData.buyerId;
      
      // Create notification for the requester/buyer with proper metadata
      if (recipientId && recipientId !== user.uid) {
        const notificationType = status === "accepted" ? "OFFER_ACCEPTED" : "OFFER_REJECTED";
        
        // Build metadata for the notification
        const metadata: any = {
          productName: exchangeData.productName,
        };
        
        // Add offer details if available
        if (exchangeData.offer) {
          metadata.offerType = exchangeData.offer.type;
          if (exchangeData.offer.offeredProductName) {
            metadata.offeredProductName = exchangeData.offer.offeredProductName;
          }
          if (exchangeData.offer.offeredProductId) {
            metadata.offeredProductId = exchangeData.offer.offeredProductId;
          }
          if (exchangeData.offer.amount) {
            metadata.offerAmount = exchangeData.offer.amount;
          }
        }
        
        await createNotification({
          recipientId: recipientId,
          senderId: user.uid,
          type: notificationType,
          entityId: exchangeId,
          metadata: metadata,
        });
        
        console.log(`Notification sent: ${notificationType} to ${recipientId} with metadata:`, metadata);
      }
    } catch (error) {
      console.error("Error handling exchange:", error);
    }
  };

  const handleSave = async () => {
    if (user) {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { name: newName, bio: newBio });
      setUserData((prev) =>
        prev ? { ...prev, name: newName, bio: newBio } : null
      );
      setIsEditing(false);
    }
  };

  const handlePasswordChange = () => {
    const auth = getAuth();
    if (auth.currentUser && auth.currentUser.email) {
      sendPasswordResetEmail(auth, auth.currentUser.email)
        .then(() => {
          alert("Password reset email sent!");
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

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      await deleteDoc(doc(db, "products", id));
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/product/${id}/edit`);
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <ProfileSkeleton />
          <div className="mt-8">
            <ProductGridSkeleton />
          </div>
        </div>
      </main>
    );
  }

  // Don't render content if no user (will redirect)
  if (!user) {
    return null;
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {userData && (
          <>
            <ProfileHero
              userData={userData}
              isEditing={isEditing}
              newName={newName}
              newBio={newBio}
              setNewName={setNewName}
              setNewBio={setNewBio}
              handleSave={handleSave}
              setIsEditing={setIsEditing}
              handlePasswordChange={handlePasswordChange}
            />

            {/* Stats Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatsCard
                icon={Package}
                label="Products Listed"
                value={products.length}
                color="bg-gradient-to-br from-blue-500 to-blue-600"
              />
              <StatsCard
                icon={ArrowRightLeft}
                label="Active Exchanges"
                value={exchanges.filter(e => e.status === 'pending').length}
                color="bg-gradient-to-br from-purple-500 to-purple-600"
              />
              <StatsCard
                icon={Check}
                label="Completed"
                value={exchanges.filter(e => e.status === 'accepted').length}
                color="bg-gradient-to-br from-green-500 to-green-600"
              />
              <StatsCard
                icon={MessageSquare}
                label="Messages"
                value="12"
                color="bg-gradient-to-br from-orange-500 to-orange-600"
              />
            </div>
          </>
        )}

        {/* My Products Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg">
                <Package className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                My Products
              </h2>
            </div>
            <Button asChild>
              <Link href="/publish">
                <Sparkles className="mr-2 h-4 w-4" />
                Add New Product
              </Link>
            </Button>
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <div key={product.id} className="group relative transform transition-all duration-300 hover:scale-105">
                  <ProductCard
                    product={product}
                    onEdit={() => handleEdit(product.id)}
                    onDelete={() => handleDelete(product.id)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Package}
              title="No products yet"
              description="Start sharing your garden's bounty with the community"
              action={
                <Button asChild>
                  <Link href="/publish">Publish Your First Product</Link>
                </Button>
              }
            />
          )}
        </div>

        {/* My Messages Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-orange-400 to-orange-500 rounded-lg">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              My Messages
            </h2>
          </div>
          <Card className="p-6 shadow-lg">
            <ChatList />
          </Card>
        </div>

        {/* My Exchanges Section */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-purple-400 to-purple-500 rounded-lg">
              <ArrowRightLeft className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              My Exchanges
            </h2>
          </div>

          {exchanges.length > 0 ? (
            <div className="space-y-4">
              {exchanges.map((exchange) => (
                <ExchangeCard
                  key={exchange.id}
                  exchange={exchange}
                  userId={user?.uid || ""}
                  onAccept={() => handleExchange(exchange.id, "accepted")}
                  onReject={() => handleExchange(exchange.id, "rejected")}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={ArrowRightLeft}
              title="No exchanges yet"
              description="Browse products to start exchanging with other gardeners"
              action={
                <Button asChild variant="outline">
                  <Link href="/">Browse Products</Link>
                </Button>
              }
            />
          )}
        </div>
      </div>
    </main>
  );
}
