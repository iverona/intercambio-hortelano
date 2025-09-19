"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  Timestamp,
  or,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowRightLeft,
  MessageSquare,
  Clock,
  CheckCircle,
  Package,
  DollarSign,
  Inbox,
  Archive,
  AlertCircle,
  ChevronRight,
} from "lucide-react";

interface Exchange {
  id: string;
  productId: string;
  productName: string;
  status: "pending" | "accepted" | "rejected" | "completed";
  requesterId: string;
  ownerId: string;
  chatId?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  completedAt?: Timestamp;
  offer?: {
    type: "exchange" | "purchase" | "chat";
    offeredProductId?: string;
    offeredProductName?: string;
    amount?: number;
    message?: string;
  };
  lastMessage?: {
    text: string;
    createdAt: Timestamp;
  };
  partner?: {
    id: string;
    name: string;
    avatarUrl: string;
  };
}

// Stats card component (reused from My Garden)
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

// Exchange item component
const ExchangeItem = ({ exchange, onClick }: { exchange: Exchange; onClick: () => void }) => {
  const { user } = useAuth();
  const isRequester = user?.uid === exchange.requesterId;
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'accepted':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getOfferTypeIcon = (type?: string) => {
    switch (type) {
      case 'exchange':
        return <ArrowRightLeft className="w-4 h-4" />;
      case 'purchase':
        return <DollarSign className="w-4 h-4" />;
      case 'chat':
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const formatTimeAgo = (timestamp?: Timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card 
      onClick={onClick}
      className="p-4 hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-[1.02] bg-white dark:bg-gray-800"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <Avatar className="h-12 w-12 border-2 border-gray-200 dark:border-gray-700">
          <AvatarImage src={exchange.partner?.avatarUrl} alt={exchange.partner?.name} />
          <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-500 text-white">
            {exchange.partner?.name?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                {exchange.productName}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isRequester ? "To: " : "From: "}{exchange.partner?.name}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`${getStatusColor(exchange.status)} border-0`}>
                {exchange.status === 'pending' && !isRequester && (
                  <AlertCircle className="w-3 h-3 mr-1" />
                )}
                {exchange.status.charAt(0).toUpperCase() + exchange.status.slice(1)}
              </Badge>
            </div>
          </div>

          {/* Offer details */}
          {exchange.offer && (
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                {getOfferTypeIcon(exchange.offer.type)}
                <span>
                  {exchange.offer.type === "exchange" && exchange.offer.offeredProductName
                    ? `Offered: ${exchange.offer.offeredProductName}`
                    : exchange.offer.type === "purchase" && exchange.offer.amount
                    ? `€${exchange.offer.amount.toFixed(2)}`
                    : "Chat request"}
                </span>
              </div>
            </div>
          )}

          {/* Last message or status info */}
          <div className="flex items-center justify-between">
            {exchange.lastMessage ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate flex-1">
                <MessageSquare className="w-3 h-3 inline mr-1" />
                {exchange.lastMessage.text}
              </p>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {exchange.status === 'pending' && !isRequester 
                  ? "Action required" 
                  : exchange.status === 'pending' && isRequester
                  ? "Waiting for response"
                  : "No messages yet"}
              </p>
            )}
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              {formatTimeAgo(exchange.lastMessage?.createdAt || exchange.updatedAt || exchange.createdAt)}
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

// Loading skeleton
const ExchangeSkeleton = () => (
  <div className="space-y-4">
    {[...Array(3)].map((_, i) => (
      <Card key={i} className="p-4">
        <div className="flex items-start gap-4 animate-pulse">
          <div className="h-12 w-12 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-1/3"></div>
            <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-1/2"></div>
            <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </Card>
    ))}
  </div>
);

export default function ExchangesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("active");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
      return;
    }

    if (!user) return;

    // Query for exchanges where user is either requester or owner
    const exchangesQuery = query(
      collection(db, "exchanges"),
      or(
        where("requesterId", "==", user.uid),
        where("ownerId", "==", user.uid)
      )
    );

    const unsubscribe = onSnapshot(exchangesQuery, async (snapshot) => {
      const exchangesData: Exchange[] = [];
      
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const exchange: Exchange = {
          id: docSnap.id,
          ...data,
        } as Exchange;

        // Get partner information
        const partnerId = data.requesterId === user.uid ? data.ownerId : data.requesterId;
        const partnerDoc = await getDoc(doc(db, "users", partnerId));
        if (partnerDoc.exists()) {
          const partnerData = partnerDoc.data();
          exchange.partner = {
            id: partnerId,
            name: partnerData.name || partnerData.displayName || "Unknown User",
            avatarUrl: partnerData.avatarUrl || "",
          };
        }

        // Get chat information if chatId exists
        if (data.chatId) {
          const chatDoc = await getDoc(doc(db, "chats", data.chatId));
          if (chatDoc.exists()) {
            const chatData = chatDoc.data();
            if (chatData.lastMessage) {
              exchange.lastMessage = chatData.lastMessage;
            }
          }
        }

        exchangesData.push(exchange);
      }

      // Sort by most recent activity
      exchangesData.sort((a, b) => {
        const timeA = (a.lastMessage?.createdAt || a.updatedAt || a.createdAt)?.toMillis() || 0;
        const timeB = (b.lastMessage?.createdAt || b.updatedAt || b.createdAt)?.toMillis() || 0;
        return timeB - timeA;
      });

      setExchanges(exchangesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading, router]);

  const handleExchangeClick = (exchange: Exchange) => {
    if (exchange.chatId) {
      router.push(`/exchanges/${exchange.chatId}`);
    }
  };

  // Filter exchanges by status
  const pendingExchanges = exchanges.filter(e => e.status === "pending");
  const activeExchanges = exchanges.filter(e => e.status === "accepted");
  const completedExchanges = exchanges.filter(e => 
    e.status === "completed" || e.status === "rejected"
  );

  // Calculate stats
  const pendingCount = pendingExchanges.filter(e => e.ownerId === user?.uid).length;
  const totalExchanges = exchanges.length;
  const completedCount = exchanges.filter(e => e.status === "completed").length;
  const successRate = totalExchanges > 0 
    ? Math.round((completedCount / totalExchanges) * 100) 
    : 0;

  if (authLoading || loading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse mb-8">
            <div className="h-8 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-48"></div>
          </div>
          <ExchangeSkeleton />
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg">
                <ArrowRightLeft className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  My Exchanges
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Manage your exchanges and conversations
                </p>
              </div>
            </div>
            <Button asChild>
              <Link href="/">
                <Package className="mr-2 h-4 w-4" />
                Browse Products
              </Link>
            </Button>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatsCard
              icon={Inbox}
              label="Pending Requests"
              value={pendingCount}
              color="bg-gradient-to-br from-yellow-500 to-orange-600"
            />
            <StatsCard
              icon={MessageSquare}
              label="Active Exchanges"
              value={activeExchanges.length}
              color="bg-gradient-to-br from-green-500 to-emerald-600"
            />
            <StatsCard
              icon={Archive}
              label="Total Exchanges"
              value={totalExchanges}
              color="bg-gradient-to-br from-blue-500 to-indigo-600"
            />
            <StatsCard
              icon={CheckCircle}
              label="Success Rate"
              value={`${successRate}%`}
              color="bg-gradient-to-br from-purple-500 to-pink-600"
            />
          </div>
        </div>

        {/* Tabs for different exchange states */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Active
              {activeExchanges.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeExchanges.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending
              {pendingExchanges.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {pendingExchanges.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
              <Archive className="w-4 h-4" />
              History
              {completedExchanges.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {completedExchanges.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Active Exchanges */}
          <TabsContent value="active" className="space-y-4 mt-6">
            {activeExchanges.length > 0 ? (
              activeExchanges.map((exchange) => (
                <ExchangeItem
                  key={exchange.id}
                  exchange={exchange}
                  onClick={() => handleExchangeClick(exchange)}
                />
              ))
            ) : (
              <EmptyState
                icon={MessageSquare}
                title="No active exchanges"
                description="Your accepted exchanges with ongoing conversations will appear here"
              />
            )}
          </TabsContent>

          {/* Pending Exchanges */}
          <TabsContent value="pending" className="space-y-4 mt-6">
            {pendingExchanges.length > 0 ? (
              <>
                {/* Show pending requests that need user's action first */}
                {pendingExchanges
                  .filter(e => e.ownerId === user?.uid)
                  .map((exchange) => (
                    <div key={exchange.id} className="relative">
                      <div className="absolute -left-2 top-0 bottom-0 w-1 bg-yellow-500 rounded-full"></div>
                      <ExchangeItem
                        exchange={exchange}
                        onClick={() => handleExchangeClick(exchange)}
                      />
                    </div>
                  ))}
                
                {/* Then show pending requests user is waiting for */}
                {pendingExchanges
                  .filter(e => e.requesterId === user?.uid)
                  .map((exchange) => (
                    <ExchangeItem
                      key={exchange.id}
                      exchange={exchange}
                      onClick={() => handleExchangeClick(exchange)}
                    />
                  ))}
              </>
            ) : (
              <EmptyState
                icon={Clock}
                title="No pending exchanges"
                description="Exchange requests waiting for approval will appear here"
              />
            )}
          </TabsContent>

          {/* Completed/Rejected Exchanges */}
          <TabsContent value="completed" className="space-y-4 mt-6">
            {completedExchanges.length > 0 ? (
              completedExchanges.map((exchange) => (
                <ExchangeItem
                  key={exchange.id}
                  exchange={exchange}
                  onClick={() => handleExchangeClick(exchange)}
                />
              ))
            ) : (
              <EmptyState
                icon={Archive}
                title="No exchange history"
                description="Your completed and rejected exchanges will appear here"
              />
            )}
          </TabsContent>
        </Tabs>

        {/* Tips Section */}
        {exchanges.length > 0 && (
          <Card className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200 dark:border-blue-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              💡 Exchange Tips
            </h3>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>• Respond to exchange requests promptly to build trust</li>
              <li>• Use the chat to coordinate pickup/delivery details</li>
              <li>• Mark exchanges as completed once the trade is done</li>
              <li>• Be clear about product condition and availability</li>
            </ul>
          </Card>
        )}
      </div>
    </main>
  );
}
