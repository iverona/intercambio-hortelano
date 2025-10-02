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
  Sparkles,
  Leaf,
} from "lucide-react";
import { useI18n } from "@/locales/provider";
import { StatsCard } from "@/components/shared/StatsCard";
import { EmptyState } from "@/components/shared/EmptyState";

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

// Exchange item component
const ExchangeItem = ({ exchange, onClick }: { exchange: Exchange; onClick: () => void }) => {
  const t = useI18n();
  const { user } = useAuth();
  const isRequester = user?.uid === exchange.requesterId;
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white';
      case 'accepted':
        return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white';
      case 'rejected':
        return 'bg-gradient-to-r from-red-500 to-pink-500 text-white';
      case 'completed':
        return 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white';
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
      className="p-5 hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02] bg-white dark:bg-gray-800 group relative overflow-hidden"
    >
      {/* Hover glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-300"></div>
      
      <div className="flex items-start gap-4 relative z-10">
        {/* Avatar */}
        <Avatar className="h-14 w-14 border-2 border-gray-200 dark:border-gray-700 shadow-md ring-2 ring-blue-100 dark:ring-blue-900">
          <AvatarImage src={exchange.partner?.avatarUrl} alt={exchange.partner?.name} />
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-lg font-bold">
            {exchange.partner?.name?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 truncate">
                {exchange.productName}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isRequester ? t('exchanges.item.to', { name: exchange.partner?.name }) : t('exchanges.item.from', { name: exchange.partner?.name })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`${getStatusColor(exchange.status)} border-0 shadow-md`}>
                {exchange.status === 'pending' && !isRequester && (
                  <AlertCircle className="w-3 h-3 mr-1" />
                )}
                {exchange.status.charAt(0).toUpperCase() + exchange.status.slice(1)}
              </Badge>
            </div>
          </div>

          {/* Offer details */}
          {exchange.offer && (
            <div className="flex items-center gap-2 mb-3 p-2 bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                {getOfferTypeIcon(exchange.offer.type)}
                <span className="font-medium">
                  {exchange.offer.type === "exchange" && exchange.offer.offeredProductName
                    ? t('exchanges.item.offered', { product: exchange.offer.offeredProductName })
                    : exchange.offer.type === "purchase" && exchange.offer.amount
                    ? `€${exchange.offer.amount.toFixed(2)}`
                    : t('exchanges.item.chat_request')}
                </span>
              </div>
            </div>
          )}

          {/* Last message or status info */}
          <div className="flex items-center justify-between">
            {exchange.lastMessage ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate flex-1 flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                {exchange.lastMessage.text}
              </p>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                {exchange.status === 'pending' && !isRequester 
                  ? t('exchanges.item.action_required')
                  : exchange.status === 'pending' && isRequester
                  ? t('exchanges.item.waiting_for_response')
                  : t('exchanges.item.no_messages')}
              </p>
            )}
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              {formatTimeAgo(exchange.lastMessage?.createdAt || exchange.updatedAt || exchange.createdAt)}
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
      <Card key={i} className="p-5">
        <div className="flex items-start gap-4 animate-pulse">
          <div className="h-14 w-14 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-full"></div>
          <div className="flex-1 space-y-3">
            <div className="h-5 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </Card>
    ))}
  </div>
);

export default function ExchangesPage() {
  const t = useI18n();
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
    router.push(`/exchanges/details/${exchange.id}`);
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
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-8">
              <div className="h-48 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-2xl"></div>
              <ExchangeSkeleton />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

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
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg">
                  <ArrowRightLeft className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
                    {t('exchanges.title')}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {t('exchanges.subtitle')}
                  </p>
                </div>
              </div>
              <Button 
                asChild
                size="lg"
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg group"
              >
                <Link href="/">
                  <Package className="mr-2 h-5 w-5" />
                  {t('exchanges.browse_products')}
                </Link>
              </Button>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                icon={Inbox}
                label={t('exchanges.stats.pending')}
                value={pendingCount}
                color="bg-gradient-to-br from-yellow-500 to-orange-500"
              />
              <StatsCard
                icon={MessageSquare}
                label={t('exchanges.stats.active')}
                value={activeExchanges.length}
                color="bg-gradient-to-br from-green-500 to-emerald-500"
              />
              <StatsCard
                icon={Archive}
                label={t('exchanges.stats.total')}
                value={totalExchanges}
                color="bg-gradient-to-br from-blue-500 to-indigo-500"
              />
              <StatsCard
                icon={CheckCircle}
                label={t('exchanges.stats.success_rate')}
                value={`${successRate}%`}
                color="bg-gradient-to-br from-purple-500 to-pink-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Tabs for different exchange states */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="active" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                {t('exchanges.tabs.active')}
                {activeExchanges.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {activeExchanges.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {t('exchanges.tabs.pending')}
                {pendingExchanges.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {pendingExchanges.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex items-center gap-2">
                <Archive className="w-4 h-4" />
                {t('exchanges.tabs.history')}
                {completedExchanges.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {completedExchanges.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Active Exchanges */}
            <TabsContent value="active" className="space-y-4">
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
                  title={t('exchanges.empty.active.title')}
                  description={t('exchanges.empty.active.subtitle')}
                />
              )}
            </TabsContent>

            {/* Pending Exchanges */}
            <TabsContent value="pending" className="space-y-4">
              {pendingExchanges.length > 0 ? (
                <>
                  {/* Show pending requests that need user's action first */}
                  {pendingExchanges
                    .filter(e => e.ownerId === user?.uid)
                    .map((exchange) => (
                      <div key={exchange.id} className="relative">
                        <div className="absolute -left-2 top-0 bottom-0 w-1 bg-gradient-to-b from-yellow-400 to-orange-400 rounded-full shadow-lg"></div>
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
                  title={t('exchanges.empty.pending.title')}
                  description={t('exchanges.empty.pending.subtitle')}
                />
              )}
            </TabsContent>

            {/* Completed/Rejected Exchanges */}
            <TabsContent value="completed" className="space-y-4">
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
                  title={t('exchanges.empty.history.title')}
                  description={t('exchanges.empty.history.subtitle')}
                />
              )}
            </TabsContent>
          </Tabs>

          {/* Tips Section */}
          {exchanges.length > 0 && (
            <Card className="mt-8 p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg shadow-md">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {t('exchanges.tips.title')}
                </h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  <span>{t('exchanges.tips.item1')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  <span>{t('exchanges.tips.item2')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  <span>{t('exchanges.tips.item3')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  <span>{t('exchanges.tips.item4')}</span>
                </li>
              </ul>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}
