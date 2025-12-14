"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  ArrowRightLeft,
  DollarSign,
  MessageSquare,
  Package,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Clock,
  Send,
  ChevronRight,
} from "lucide-react";
import { createNotification, NotificationMetadata } from "@/lib/notifications";
import { useI18n } from "@/locales/provider";
import { toast } from "sonner";
import { ReviewSection } from "@/components/shared/ReviewSection";
import { submitReview } from "@/lib/reviewHelpers";
import Link from "next/link";
import { useExchangeDetails } from "@/hooks/useExchanges";
import { Timestamp } from "firebase/firestore";

export default function ExchangeDetailsPage() {
  const t = useI18n();
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const exchangeId = params.exchangeId as string;
  const { exchange, loading, messages, sendMessage, updateStatus } = useExchangeDetails(exchangeId);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


  const handleAcceptOffer = async () => {
    if (!exchange || !user) return;

    try {
      await updateStatus("accepted");

      // Send notification to the requester
      const acceptMetadata: NotificationMetadata = {};
      if (exchange.productName) {
        acceptMetadata.productName = exchange.productName;
      }
      if (exchange.productId) {
        acceptMetadata.productId = exchange.productId;
      }
      if (exchange.offer) {
        acceptMetadata.offerType = exchange.offer.type;
        if (exchange.offer.offeredProductName) {
          acceptMetadata.offeredProductName = exchange.offer.offeredProductName;
        }
        if (exchange.offer.amount) {
          acceptMetadata.offerAmount = exchange.offer.amount;
        }
      }

      await createNotification({
        recipientId: exchange.requesterId,
        senderId: user.uid,
        type: "OFFER_ACCEPTED",
        entityId: exchange.id,
        metadata: acceptMetadata,
      });

      toast.success(t('exchanges.details.toast.offer_accepted'));
    } catch (error) {
      console.error("Error accepting offer:", error);
      toast.error(t('exchanges.details.toast.failed_to_accept'));
    }
  };

  const handleRejectOffer = async () => {
    if (!exchange || !user) return;

    try {
      await updateStatus("rejected");

      // Send notification to the requester
      const rejectMetadata: NotificationMetadata = {};
      if (exchange.productName) {
        rejectMetadata.productName = exchange.productName;
      }
      if (exchange.productId) {
        rejectMetadata.productId = exchange.productId;
      }
      if (exchange.offer) {
        rejectMetadata.offerType = exchange.offer.type;
        if (exchange.offer.offeredProductName) {
          rejectMetadata.offeredProductName = exchange.offer.offeredProductName;
        }
        if (exchange.offer.amount) {
          rejectMetadata.offerAmount = exchange.offer.amount;
        }
      }

      await createNotification({
        recipientId: exchange.requesterId,
        senderId: user.uid,
        type: "OFFER_REJECTED",
        entityId: exchange.id,
        metadata: rejectMetadata,
      });

      toast.info(t('exchanges.details.toast.offer_declined'));
    } catch (error) {
      console.error("Error rejecting offer:", error);
      toast.error(t('exchanges.details.toast.failed_to_decline'));
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === "" || !user || !exchange) return;

    try {
      await sendMessage(newMessage);

      // Send notification to the chat partner
      const partnerId = exchange.requesterId === user.uid ? exchange.ownerId : exchange.requesterId;

      if (partnerId) {
        const messageMetadata: NotificationMetadata = {};
        const senderName = user.displayName || user.email || "Someone";
        if (senderName) {
          messageMetadata.senderName = senderName;
        }
        if (newMessage) {
          messageMetadata.message = newMessage.substring(0, 100);
        }

        await createNotification({
          recipientId: partnerId,
          senderId: user.uid,
          type: "MESSAGE_RECEIVED",
          entityId: exchange.id,
          metadata: messageMetadata,
        });
      }

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      // Toast already handled in hook but we can keep it here too if we want specific error message
    }
  };

  const handleReviewSubmit = async (rating: number, comment: string) => {
    if (!exchange || !user) return;
    try {
      await submitReview({
        exchangeId: exchange.id,
        rating,
        comment,
        currentUserId: user.uid,
        reviewedUserId: partner?.id || "",
        exchangeProductName: exchange.productName,
        currentUserName: user.displayName || user.email || "Someone",
      });
      toast.success(t('exchanges.details.toast.review_submitted'));
    } catch (error) {
      console.error(error);
      toast.error(t('exchanges.details.toast.failed_to_submit_review'));
    }
  };

  const getOfferTypeIcon = (type?: string) => {
    switch (type) {
      case 'exchange':
        return <ArrowRightLeft className="w-5 h-5" />;
      case 'purchase':
        return <DollarSign className="w-5 h-5" />;
      case 'chat':
        return <MessageSquare className="w-5 h-5" />;
      default:
        return <Package className="w-5 h-5" />;
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
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatDate = (timestamp?: Timestamp) => {
    if (!timestamp) return '';
    return timestamp.toDate().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </Card>
        </div>
      </main>
    );
  }

  if (!exchange) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="p-8 text-center">
            <p className="text-gray-500">{t('exchanges.details.toast.exchange_not_found')}</p>
            <Button onClick={() => router.push("/exchanges")} className="mt-4">
              {t('exchanges.details.back_to_exchanges')}
            </Button>
          </Card>
        </div>
      </main>
    );
  }

  const isOwner = user?.uid === exchange.ownerId;
  const isRequester = user?.uid === exchange.requesterId;
  const partner = isOwner ? exchange.requester : exchange.owner;

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Breadcrumb Navigation */}
      <div className="border-b bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Link href="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/exchanges" className="hover:text-primary transition-colors">
              Exchanges
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 dark:text-gray-100 font-medium truncate max-w-[200px]">
              {exchange.productName}
            </span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20 border-b">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>

        <div className="relative container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl shadow-lg">
                {getOfferTypeIcon(exchange.offer?.type)}
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                  {exchange.productName}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {isOwner ? `Request from ${partner?.name}` : `Your request to ${partner?.name}`}
                </p>
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-2">
              <Badge className={`${getStatusColor(exchange.status)} border-0 shadow-md`}>
                {exchange.status.charAt(0).toUpperCase() + exchange.status.slice(1)}
              </Badge>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {formatDate(exchange.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Back button */}
          <Button
            variant="ghost"
            onClick={() => router.push("/exchanges")}
            className="mb-6 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300 shadow-sm hover:shadow-md"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('exchanges.details.back_to_exchanges')}
          </Button>

          {/* Exchange Details Card */}
          <Card className="p-6 backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg">
                  {getOfferTypeIcon(exchange.offer?.type)}
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                    {t('exchanges.details.title')}
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {t('exchanges.details.created', { date: formatDate(exchange.createdAt) })}
                  </p>
                </div>
              </div>
              <Badge className={`${getStatusColor(exchange.status)} border-0 shadow-md`}>
                {exchange.status.charAt(0).toUpperCase() + exchange.status.slice(1)}
              </Badge>
            </div>

            {/* Product Information */}
            <div className="mb-6 p-5 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 rounded-xl border border-blue-100 dark:border-blue-900 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  <Package className="w-4 h-4" />
                </div>
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                  {t('exchanges.details.product_info')}
                </h2>
              </div>
              {exchange.product && (
                <div className="space-y-3">
                  {exchange.product.images.length > 0 && (
                    <img
                      src={exchange.product.images[0]}
                      alt={exchange.productName}
                      className="w-full h-48 object-cover rounded-lg mb-3 shadow-md hover:shadow-lg transition-shadow duration-300"
                    />
                  )}
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium text-gray-900 dark:text-gray-100">Title:</span> {exchange.productName}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium text-gray-900 dark:text-gray-100">Category:</span> {exchange.product.category}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium text-gray-900 dark:text-gray-100">Description:</span> {exchange.product.description}
                  </p>
                </div>
              )}
            </div>

            {/* Offer Details */}
            <div className="mb-6 p-5 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 rounded-xl border border-green-100 dark:border-green-900 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                  {getOfferTypeIcon(exchange.offer?.type)}
                </div>
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                  {t('exchanges.details.offer_details')}
                </h2>
              </div>
              <div className="space-y-3">
                {exchange.offer?.type === "exchange" && exchange.offer.offeredProductName && (
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium text-gray-900 dark:text-gray-100">Type:</span> Exchange
                  </p>
                )}
                {exchange.offer?.type === "exchange" && exchange.offer.offeredProductName && (
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium text-gray-900 dark:text-gray-100">Offered Product:</span> {exchange.offer.offeredProductName}
                  </p>
                )}
                {exchange.offer?.type === "purchase" && exchange.offer.amount && (
                  <>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium text-gray-900 dark:text-gray-100">Type:</span> Purchase
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium text-gray-900 dark:text-gray-100">Amount:</span> \u20AC{exchange.offer.amount.toFixed(2)}
                    </p>
                  </>
                )}
                {exchange.offer?.type === "chat" && (
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium text-gray-900 dark:text-gray-100">Type:</span> Chat Request
                  </p>
                )}
                {exchange.offer?.message && (
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium text-gray-900 dark:text-gray-100">Message:</span> {exchange.offer.message}
                  </p>
                )}
              </div>
            </div>

            {/* Partner Information */}
            <div className="mb-6 p-5 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/50 dark:to-amber-950/50 rounded-xl border border-orange-100 dark:border-orange-900 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 text-white">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="bg-transparent text-white text-xs">
                      {partner?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                  {isOwner ? t('exchanges.details.partner_info.requester') : t('exchanges.details.partner_info.owner')}
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 ring-2 ring-orange-200 dark:ring-orange-800">
                  <AvatarImage src={partner?.avatarUrl} alt={partner?.name} />
                  <AvatarFallback className="bg-gradient-to-br from-orange-400 to-amber-500 text-white">
                    {partner?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {partner?.name || "Unknown User"}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isOwner ? t('exchanges.details.partner_info.requested') : t('exchanges.details.partner_info.owns')}
                  </p>
                </div>
              </div>
            </div>

          </Card>

          <div className="mt-6 space-y-4">
            {/* Action Buttons */}
            {exchange.status === "pending" && isOwner && (
              <div className="flex gap-3">
                <Button
                  onClick={handleAcceptOffer}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 group"
                >
                  <CheckCircle className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                  {t('exchanges.details.accept_offer')}
                </Button>
                <Button
                  onClick={handleRejectOffer}
                  className="flex-1 border-2 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950 transition-all duration-300 group"
                  variant="outline"
                >
                  <XCircle className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                  {t('exchanges.details.decline_offer')}
                </Button>
              </div>
            )}

            {exchange.status === "pending" && isRequester && (
              <div className="p-6 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/50 dark:to-amber-950/50 rounded-xl border border-yellow-200 dark:border-yellow-800 text-center shadow-sm">
                <div className="p-3 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 text-white w-fit mx-auto mb-3">
                  <Clock className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('exchanges.details.waiting_for_owner')}
                </p>
              </div>
            )}

            {exchange.status === "accepted" && (
              <div className="space-y-3">
                <Button
                  onClick={async () => {
                    try {
                      await updateStatus('completed');

                      // Send notification to the other party
                      const recipientId = exchange.requesterId === user?.uid
                        ? exchange.ownerId
                        : exchange.requesterId;

                      const completeMetadata: NotificationMetadata = {};
                      if (exchange.productName) {
                        completeMetadata.productName = exchange.productName;
                      }
                      if (exchange.productId) {
                        completeMetadata.productId = exchange.productId;
                      }
                      if (exchange.offer) {
                        completeMetadata.offerType = exchange.offer.type;
                        if (exchange.offer.offeredProductName) {
                          completeMetadata.offeredProductName = exchange.offer.offeredProductName;
                        }
                        if (exchange.offer.amount) {
                          completeMetadata.offerAmount = exchange.offer.amount;
                        }
                      }

                      await createNotification({
                        recipientId,
                        senderId: user!.uid,
                        type: "EXCHANGE_COMPLETED",
                        entityId: exchange.chatId || exchange.id,
                        metadata: completeMetadata,
                      });

                      toast.success(t('exchanges.details.toast.exchange_completed'));
                    } catch (error) {
                      console.error("Error completing exchange:", error);
                      toast.error(t('exchanges.details.toast.failed_to_complete'));
                    }
                  }}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 group"
                >
                  <CheckCircle className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                  {t('exchanges.details.mark_as_completed')}
                </Button>
              </div>
            )}

            {exchange.status === "rejected" && (
              <div className="p-6 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/50 dark:to-rose-950/50 rounded-xl border border-red-200 dark:border-red-800 text-center shadow-sm">
                <div className="p-3 rounded-full bg-gradient-to-br from-red-400 to-rose-500 text-white w-fit mx-auto mb-3">
                  <XCircle className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('exchanges.details.offer_declined')}
                </p>
              </div>
            )}

            {exchange.status === "completed" && (
              <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 rounded-xl border border-green-200 dark:border-green-800 text-center shadow-sm">
                <div className="p-3 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 text-white w-fit mx-auto mb-3 animate-pulse">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('exchanges.details.exchange_completed')}
                </p>
              </div>
            )}
          </div>

          {/* Review Section - Shows for completed exchanges */}
          {exchange.status === "completed" && (
            <Card className="mt-6 p-0 overflow-hidden backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
              <div className="p-6 border-b bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-950/80 dark:to-red-950/80">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-lg">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400 bg-clip-text text-transparent">
                      {t('exchanges.details.reviews.title')}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {t('exchanges.details.reviews.subtitle')}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <ReviewSection
                  exchangeId={exchange.id}
                  currentUserId={user?.uid || ""}
                  partnerId={partner?.id || ""}
                  partnerName={partner?.name || "Unknown"}
                  onReviewSubmit={handleReviewSubmit}
                />
              </div>
            </Card>
          )}

          {/* Chat Section - Show if accepted or completed */}
          {(exchange.status === "accepted" || exchange.status === "completed") && (
            <Card className="mt-6 p-0 overflow-hidden backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
              <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                      {t('exchanges.details.chat.title', { name: partner?.name })}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {t('exchanges.details.chat.subtitle')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="h-[400px] overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-gray-900/50">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 space-y-3">
                    <div className="p-4 rounded-full bg-blue-100 dark:bg-blue-900/30">
                      <MessageSquare className="w-8 h-8 text-blue-500 dark:text-blue-400" />
                    </div>
                    <p className="font-medium">{t('exchanges.details.chat.no_messages')}</p>
                    <p className="text-sm">{t('exchanges.details.chat.start_conversation')}</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderId === user?.uid;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[75%] p-3 rounded-2xl shadow-sm ${isMe
                            ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-tr-none"
                            : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-none border border-gray-100 dark:border-gray-700"
                            }`}
                        >
                          <p className="text-sm">{msg.text}</p>
                          <p className={`text-[10px] mt-1 ${isMe ? "text-blue-100" : "text-gray-400"}`}>
                            {formatDate(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={t('exchanges.details.chat.placeholder')}
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </Card>
          )}

        </div>
      </div>
    </main>
  );
}
