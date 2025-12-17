"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
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
} from "lucide-react";
import { useI18n } from "@/locales/provider";
import { StatsCard } from "@/components/shared/StatsCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { useExchanges } from "@/hooks/useExchanges";
import { Exchange } from "@/types/exchange";
import { Timestamp } from "firebase/firestore";

// Exchange item component
const ExchangeItem = ({ exchange, onClick }: { exchange: Exchange; onClick: () => void }) => {
  const t = useI18n();
  const { user } = useAuth();
  const isRequester = user?.uid === exchange.requesterId;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-[#EFEAC6] text-[#594a42] dark:bg-[#4a463a] dark:text-[#EFEAC6] border-[#D4CFAE] dark:border-[#5e5a4b]';
      case 'accepted':
        return 'bg-[#6B8E23]/20 text-[#3a4d13] dark:bg-[#556B2F]/40 dark:text-[#d6c7b0] border-[#6B8E23]/30';
      case 'rejected':
        return 'bg-[#A88C8F]/20 text-[#5e4043] dark:bg-[#7a6466]/40 dark:text-[#d6c7b0] border-[#A88C8F]/30';
      case 'completed':
        return 'bg-[#879385]/20 text-[#3d453c] dark:bg-[#525b51]/40 dark:text-[#d6c7b0] border-[#879385]/30';
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
      className="p-4 md:p-5 hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02] bg-[#FDFBF7] dark:bg-[#2e2c28] border-gray-100 dark:border-gray-700 group relative overflow-hidden"
    >
      {/* Hover glow effect */}
      <div className="absolute inset-0 bg-[#A6C6B9]/10 dark:bg-[#4A5D54]/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

      <div className="flex items-start gap-3 md:gap-4 relative z-10">
        {/* Avatar */}
        <Avatar className="h-12 w-12 md:h-14 md:w-14 border-2 border-[#EFEAC6] dark:border-[#4a463a] shadow-md flex-shrink-0">
          <AvatarImage src={exchange.partner?.avatarUrl} alt={exchange.partner?.name} />
          <AvatarFallback className="bg-[#A88C8F] dark:bg-[#6b585a] text-white text-lg font-bold">
            {exchange.partner?.name?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1 md:mb-2 gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-base md:text-lg text-[#594a42] dark:text-[#d6c7b0] truncate">
                {exchange.productName}
              </h3>
              <p className="text-xs md:text-sm text-[#879385] dark:text-[#998676] truncate">
                {isRequester ? t('exchanges.item.to', { name: exchange.partner?.name }) : t('exchanges.item.from', { name: exchange.partner?.name })}
              </p>
            </div>
            <Badge className={`${getStatusColor(exchange.status)} border shadow-sm text-xs flex-shrink-0`}>
              {exchange.status === 'pending' && !isRequester && (
                <AlertCircle className="w-3 h-3 mr-1" />
              )}
              <span className="hidden sm:inline">{exchange.status.charAt(0).toUpperCase() + exchange.status.slice(1)}</span>
              <span className="sm:hidden">{exchange.status.charAt(0).toUpperCase()}</span>
            </Badge>
          </div>

          {/* Offer details */}
          {exchange.offer && (
            <div className="flex items-center gap-2 mb-2 md:mb-3 p-2 bg-[#FFFBE6] dark:bg-[#2C2A25] rounded-lg border border-[#EFEAC6] dark:border-[#4a463a]">
              <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-[#594a42] dark:text-[#d6c7b0] min-w-0">
                <span className="flex-shrink-0 text-[#6B8E23] dark:text-[#556B2F]">{getOfferTypeIcon(exchange.offer.type)}</span>
                <span className="font-medium truncate">
                  {exchange.offer.type === "exchange" && exchange.offer.offeredProductName
                    ? t('exchanges.item.offered', { product: exchange.offer.offeredProductName })
                    : exchange.offer.type === "purchase" && exchange.offer.amount
                      ? `\u20AC${exchange.offer.amount.toFixed(2)}`
                      : t('exchanges.item.chat_request')}
                </span>
              </div>
            </div>
          )}

          {/* Last message or status info */}
          <div className="flex items-center justify-between gap-2">
            {exchange.lastMessage ? (
              <p className="text-xs md:text-sm text-[#879385] dark:text-[#998676] truncate flex-1 flex items-center gap-1">
                <MessageSquare className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{exchange.lastMessage.text}</span>
              </p>
            ) : (
              <p className="text-xs md:text-sm text-[#879385] dark:text-[#998676] italic truncate flex-1">
                {exchange.status === 'pending' && !isRequester
                  ? t('exchanges.item.action_required')
                  : exchange.status === 'pending' && isRequester
                    ? t('exchanges.item.waiting_for_response')
                    : t('exchanges.item.no_messages')}
              </p>
            )}
            <div className="flex items-center gap-1 md:gap-2 text-xs text-[#A88C8F] dark:text-[#7a6466] flex-shrink-0">
              <Clock className="w-3 h-3 hidden sm:inline" />
              <span className="hidden sm:inline">{formatTimeAgo(exchange.lastMessage?.createdAt || exchange.updatedAt || exchange.createdAt)}</span>
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
  <div className="space-y-3 md:space-y-4">
    {[...Array(3)].map((_, i) => (
      <Card key={i} className="p-4 md:p-5">
        <div className="flex items-start gap-3 md:gap-4 animate-pulse">
          <div className="h-12 w-12 md:h-14 md:w-14 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-full flex-shrink-0"></div>
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
  const { exchanges, loading: exchangesLoading } = useExchanges();
  const [activeTab, setActiveTab] = useState("active");

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

  if (authLoading || exchangesLoading) {
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
    // Should be handled by AuthContext redirect or middleware but logic kept for safety
    if (!authLoading) router.push("/");
    return null;
  }

  return (
    <main className="min-h-screen bg-[#FFFBE6] dark:bg-[#2C2A25] pb-20 md:pb-0">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-[#FDFBF7] dark:bg-[#2e2c28] border-b border-[#EFEAC6] dark:border-[#4a463a]">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#A6C6B9] dark:bg-[#4A5D54] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#A88C8F] dark:bg-[#6b585a] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-1/2 w-80 h-80 bg-[#879385] dark:bg-[#525b51] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 md:mb-8">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="p-2 md:p-3 bg-[#6B8E23] dark:bg-[#556B2F] rounded-xl shadow-lg flex-shrink-0">
                  <ArrowRightLeft className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-2xl md:text-4xl font-bold text-[#594a42] dark:text-[#d6c7b0]">
                    {t('exchanges.title')}
                  </h1>
                  <p className="text-sm md:text-base text-[#879385] dark:text-[#998676] mt-1 truncate">
                    {t('exchanges.subtitle')}
                  </p>
                </div>
              </div>
              <Button
                asChild
                size="default"
                className="bg-[#A88C8F] dark:bg-[#7a6466] hover:bg-[#997b7e] dark:hover:bg-[#8f7577] text-white shadow-lg group w-full md:w-auto"
              >
                <Link href="/">
                  <Package className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                  <span className="hidden sm:inline">{t('exchanges.browse_products')}</span>
                  <span className="sm:hidden">Browse</span>
                </Link>
              </Button>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <StatsCard
                icon={Inbox}
                label={t('exchanges.stats.pending')}
                value={pendingCount}
                color="bg-[#EFEAC6] text-[#594a42] dark:bg-[#4a463a] dark:text-[#EFEAC6]"
              />
              <StatsCard
                icon={MessageSquare}
                label={t('exchanges.stats.active')}
                value={activeExchanges.length}
                color="bg-[#6B8E23] text-white dark:bg-[#556B2F]"
              />
              <StatsCard
                icon={Archive}
                label={t('exchanges.stats.total')}
                value={totalExchanges}
                color="bg-[#879385] text-white dark:bg-[#525b51]"
              />
              <StatsCard
                icon={CheckCircle}
                label={t('exchanges.stats.success_rate')}
                value={`${successRate}%`}
                color="bg-[#A88C8F] text-white dark:bg-[#7a6466]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Tabs for different exchange states */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4 md:mb-6 bg-[#FDFBF7] dark:bg-[#2e2c28] border border-[#EFEAC6] dark:border-[#4a463a]">
              <TabsTrigger value="active" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm data-[state=active]:bg-[#A88C8F] data-[state=active]:text-white dark:data-[state=active]:bg-[#7a6466]">
                <MessageSquare className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">{t('exchanges.tabs.active')}</span>
                <span className="sm:hidden">Active</span>
                {activeExchanges.length > 0 && (
                  <Badge variant="secondary" className="ml-1 bg-white/20 text-white">
                    {activeExchanges.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="pending" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm data-[state=active]:bg-[#EFEAC6] data-[state=active]:text-[#594a42] dark:data-[state=active]:bg-[#4a463a] dark:data-[state=active]:text-[#EFEAC6]">
                <Clock className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">{t('exchanges.tabs.pending')}</span>
                <span className="sm:hidden">Pending</span>
                {pendingExchanges.length > 0 && (
                  <Badge variant="secondary" className="ml-1 bg-black/10 dark:bg-white/10">
                    {pendingExchanges.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm data-[state=active]:bg-[#879385] data-[state=active]:text-white dark:data-[state=active]:bg-[#525b51]">
                <Archive className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">{t('exchanges.tabs.history')}</span>
                <span className="sm:hidden">History</span>
                {completedExchanges.length > 0 && (
                  <Badge variant="secondary" className="ml-1 bg-white/20 text-white">
                    {completedExchanges.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Active Exchanges */}
            <TabsContent value="active" className="space-y-3 md:space-y-4">
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
            <TabsContent value="pending" className="space-y-3 md:space-y-4">
              {pendingExchanges.length > 0 ? (
                <>
                  {/* Show pending requests that need user's action first */}
                  {pendingExchanges
                    .filter(e => e.ownerId === user?.uid)
                    .map((exchange) => (
                      <div key={exchange.id} className="relative">
                        <div className="absolute -left-2 top-0 bottom-0 w-1 bg-[#EFEAC6] dark:bg-[#4a463a] rounded-full shadow-lg"></div>
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
            <TabsContent value="completed" className="space-y-3 md:space-y-4">
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
            <Card className="mt-6 md:mt-8 p-4 md:p-6 bg-[#FDFBF7] dark:bg-[#2e2c28] border-[#EFEAC6] dark:border-[#4a463a] shadow-lg">
              <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                <div className="p-1.5 md:p-2 bg-[#6B8E23] dark:bg-[#556B2F] rounded-lg shadow-md flex-shrink-0">
                  <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <h3 className="text-base md:text-lg font-bold text-[#594a42] dark:text-[#d6c7b0]">
                  {t('exchanges.tips.title')}
                </h3>
              </div>
              <ul className="space-y-2 text-xs md:text-sm text-[#3e3b34] dark:text-[#998676]">
                <li className="flex items-start gap-2">
                  <span className="text-[#6B8E23] mt-0.5">•</span>
                  <span>{t('exchanges.tips.item1')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#6B8E23] mt-0.5">•</span>
                  <span>{t('exchanges.tips.item2')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#6B8E23] mt-0.5">•</span>
                  <span>{t('exchanges.tips.item3')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#6B8E23] mt-0.5">•</span>
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
