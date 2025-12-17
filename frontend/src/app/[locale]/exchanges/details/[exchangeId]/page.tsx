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
        return 'bg-[#EFEAC6] text-[#594a42] dark:bg-[#4a463a] dark:text-[#EFEAC6] border border-[#D4CFAE] dark:border-[#5e5a4b]';
      case 'accepted':
        return 'bg-[#6B8E23]/20 text-[#3a4d13] dark:bg-[#556B2F]/40 dark:text-[#d6c7b0] border border-[#6B8E23]/30';
      case 'rejected':
        return 'bg-[#A88C8F]/20 text-[#5e4043] dark:bg-[#7a6466]/40 dark:text-[#d6c7b0] border border-[#A88C8F]/30';
      case 'completed':
        return 'bg-[#879385]/20 text-[#3d453c] dark:bg-[#525b51]/40 dark:text-[#d6c7b0] border border-[#879385]/30';
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
      <main className="container mx-auto px-4 py-8 bg-[#FFFBE6] dark:bg-[#2C2A25] min-h-screen">
        <div className="max-w-2xl mx-auto">
          <Card className="p-8 bg-[#FDFBF7] dark:bg-[#2e2c28]">
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
      <main className="container mx-auto px-4 py-8 bg-[#FFFBE6] dark:bg-[#2C2A25] min-h-screen">
        <div className="max-w-2xl mx-auto">
          <Card className="p-8 text-center bg-[#FDFBF7] dark:bg-[#2e2c28]">
            <p className="text-[#879385] dark:text-[#998676]">{t('exchanges.details.toast.exchange_not_found')}</p>
            <Button onClick={() => router.push("/exchanges")} className="mt-4 bg-[#A88C8F] hover:bg-[#997b7e] text-white">
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

  // Extract reviews if they exist
  // We need to cast to any first because of type mismatches between the Review types
  // defined in different files. Ideally these should be unified.
  const reviews = exchange.reviews as Record<string, any> | undefined;
  const existingReviewByUser = user ? reviews?.[user.uid] : undefined;
  const existingReviewByPartner = partner ? reviews?.[partner.id] : undefined;

  return (
    <main className="min-h-screen bg-[#FFFBE6] dark:bg-[#2C2A25]">
      {/* Breadcrumb Navigation */}
      <div className="border-b border-[#EFEAC6] dark:border-[#4a463a] bg-[#FFFBE6]/50 dark:bg-[#2C2A25]/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-[#879385] dark:text-[#998676]">
            <Link href="/" className="hover:text-[#594a42] dark:hover:text-[#d6c7b0] transition-colors">
              Home
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/exchanges" className="hover:text-[#594a42] dark:hover:text-[#d6c7b0] transition-colors">
              Exchanges
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-[#594a42] dark:text-[#d6c7b0] font-medium truncate max-w-[200px]">
              {exchange.productName}
            </span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-[#FDFBF7] dark:bg-[#2e2c28] border-b border-[#EFEAC6] dark:border-[#4a463a]">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#A6C6B9] dark:bg-[#4A5D54] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#A88C8F] dark:bg-[#6b585a] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>

        <div className="relative container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-[#6B8E23] dark:bg-[#556B2F] rounded-xl shadow-lg text-white">
                {getOfferTypeIcon(exchange.offer?.type)}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[#594a42] dark:text-[#d6c7b0]">
                  {exchange.productName}
                </h1>
                <p className="text-[#879385] dark:text-[#998676] mt-1">
                  {isOwner ? `Request from ${partner?.name}` : `Your request to ${partner?.name}`}
                </p>
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-2">
              <Badge className={`${getStatusColor(exchange.status)} shadow-md`}>
                {exchange.status.charAt(0).toUpperCase() + exchange.status.slice(1)}
              </Badge>
              <span className="text-sm text-[#879385] dark:text-[#998676]">
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
            className="mb-6 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300 shadow-sm hover:shadow-md text-[#594a42] dark:text-[#d6c7b0]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('exchanges.details.back_to_exchanges')}
          </Button>

          {/* Exchange Details Card */}
          <Card className="p-6 backdrop-blur-sm bg-[#FDFBF7]/80 dark:bg-[#2e2c28]/80 shadow-xl border border-[#EFEAC6] dark:border-[#4a463a] hover:shadow-2xl transition-all duration-300">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-[#A88C8F] dark:bg-[#7a6466] text-white shadow-lg">
                  {getOfferTypeIcon(exchange.offer?.type)}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-[#594a42] dark:text-[#d6c7b0]">
                    {t('exchanges.details.title')}
                  </h1>
                  <p className="text-sm text-[#879385] dark:text-[#998676] mt-1">
                    {t('exchanges.details.created', { date: formatDate(exchange.createdAt) })}
                  </p>
                </div>
              </div>
              <Badge className={`${getStatusColor(exchange.status)} shadow-md`}>
                {exchange.status.charAt(0).toUpperCase() + exchange.status.slice(1)}
              </Badge>
            </div>

            {/* Product Information */}
            <div className="mb-6 p-5 bg-[#FFFBE6] dark:bg-[#2C2A25] rounded-xl border border-[#EFEAC6] dark:border-[#4a463a] shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-[#A88C8F] dark:bg-[#7a6466] text-white">
                  <Package className="w-4 h-4" />
                </div>
                <h2 className="font-semibold text-[#594a42] dark:text-[#d6c7b0]">
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
                  <p className="text-sm text-[#3e3b34] dark:text-[#998676]">
                    <span className="font-medium text-[#594a42] dark:text-[#d6c7b0]">Title:</span> {exchange.productName}
                  </p>
                  <p className="text-sm text-[#3e3b34] dark:text-[#998676]">
                    <span className="font-medium text-[#594a42] dark:text-[#d6c7b0]">Category:</span> {exchange.product.category}
                  </p>
                  <p className="text-sm text-[#3e3b34] dark:text-[#998676]">
                    <span className="font-medium text-[#594a42] dark:text-[#d6c7b0]">Description:</span> {exchange.product.description}
                  </p>
                </div>
              )}
            </div>

            {/* Offer Details */}
            <div className="mb-6 p-5 bg-[#FDFBF7] dark:bg-[#2e2c28] rounded-xl border border-[#EFEAC6] dark:border-[#4a463a] shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-[#6B8E23] dark:bg-[#556B2F] text-white">
                  {getOfferTypeIcon(exchange.offer?.type)}
                </div>
                <h2 className="font-semibold text-[#594a42] dark:text-[#d6c7b0]">
                  {t('exchanges.details.offer_details')}
                </h2>
              </div>
              <div className="space-y-3">
                {exchange.offer?.type === "exchange" && exchange.offer.offeredProductName && (
                  <p className="text-sm text-[#3e3b34] dark:text-[#998676]">
                    <span className="font-medium text-[#594a42] dark:text-[#d6c7b0]">Type:</span> Exchange
                  </p>
                )}
                {exchange.offer?.type === "exchange" && exchange.offer.offeredProductName && (
                  <p className="text-sm text-[#3e3b34] dark:text-[#998676]">
                    <span className="font-medium text-[#594a42] dark:text-[#d6c7b0]">Offered Product:</span> {exchange.offer.offeredProductName}
                  </p>
                )}
                {exchange.offer?.type === "purchase" && exchange.offer.amount && (
                  <>
                    <p className="text-sm text-[#3e3b34] dark:text-[#998676]">
                      <span className="font-medium text-[#594a42] dark:text-[#d6c7b0]">Type:</span> Purchase
                    </p>
                    <p className="text-sm text-[#3e3b34] dark:text-[#998676]">
                      <span className="font-medium text-[#594a42] dark:text-[#d6c7b0]">Amount:</span> \u20AC{exchange.offer.amount.toFixed(2)}
                    </p>
                  </>
                )}
                {exchange.offer?.type === "chat" && (
                  <p className="text-sm text-[#3e3b34] dark:text-[#998676]">
                    <span className="font-medium text-[#594a42] dark:text-[#d6c7b0]">Type:</span> Chat Request
                  </p>
                )}
                {exchange.offer?.message && (
                  <p className="text-sm text-[#3e3b34] dark:text-[#998676]">
                    <span className="font-medium text-[#594a42] dark:text-[#d6c7b0]">Message:</span> {exchange.offer.message}
                  </p>
                )}
              </div>
            </div>

            {/* Partner Information */}
            <div className="mb-6 p-5 bg-[#FFFBE6] dark:bg-[#2C2A25] rounded-xl border border-[#EFEAC6] dark:border-[#4a463a] shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-[#A88C8F] dark:bg-[#7a6466] text-white">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="bg-transparent text-white text-xs">
                      {partner?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <h2 className="font-semibold text-[#594a42] dark:text-[#d6c7b0]">
                  {isOwner ? t('exchanges.details.partner_info.requester') : t('exchanges.details.partner_info.owner')}
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border border-[#EFEAC6] dark:border-[#4a463a]">
                  <AvatarImage src={partner?.avatarUrl} alt={partner?.name} />
                  <AvatarFallback className="bg-[#A88C8F] dark:bg-[#6b585a] text-white">
                    {partner?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-[#594a42] dark:text-[#d6c7b0]">
                    {partner?.name || "Unknown User"}
                  </p>
                  <p className="text-sm text-[#879385] dark:text-[#998676]">
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
                  className="flex-1 bg-[#6B8E23] hover:bg-[#556B2F] text-white shadow-lg hover:shadow-xl transition-all duration-300 group"
                >
                  <CheckCircle className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                  {t('exchanges.details.accept_offer')}
                </Button>
                <Button
                  onClick={handleRejectOffer}
                  className="flex-1 border-2 border-[#A88C8F] text-[#A88C8F] hover:bg-[#A88C8F]/10 transition-all duration-300 group"
                  variant="outline"
                >
                  <XCircle className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                  {t('exchanges.details.decline_offer')}
                </Button>
              </div>
            )}

            {exchange.status === "pending" && isRequester && (
              <div className="p-6 bg-[#FFFBE6] dark:bg-[#2C2A25] rounded-xl border border-[#EFEAC6] dark:border-[#4a463a] text-center shadow-sm">
                <div className="p-3 rounded-full bg-[#EFEAC6] dark:bg-[#4a463a] text-[#594a42] w-fit mx-auto mb-3">
                  <Clock className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-[#594a42] dark:text-[#d6c7b0]">
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
                  className="w-full bg-[#A88C8F] hover:bg-[#997b7e] text-white shadow-lg hover:shadow-xl transition-all duration-300 group"
                >
                  <CheckCircle className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                  {t('exchanges.details.mark_as_completed')}
                </Button>
              </div>
            )}

            {exchange.status === "rejected" && (
              <div className="p-6 bg-[#FFFBE6] dark:bg-[#2C2A25] rounded-xl border border-[#A88C8F] dark:border-[#7a6466] text-center shadow-sm">
                <div className="p-3 rounded-full bg-[#A88C8F] dark:bg-[#7a6466] text-white w-fit mx-auto mb-3">
                  <XCircle className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-[#594a42] dark:text-[#d6c7b0]">
                  {t('exchanges.details.offer_declined')}
                </p>
              </div>
            )}

            {exchange.status === "completed" && (
              <div className="p-6 bg-[#FDFBF7] dark:bg-[#2e2c28] rounded-xl border border-[#6B8E23] dark:border-[#556B2F] text-center shadow-sm">
                <div className="p-3 rounded-full bg-[#6B8E23] dark:bg-[#556B2F] text-white w-fit mx-auto mb-3 animate-pulse">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-[#594a42] dark:text-[#d6c7b0]">
                  {t('exchanges.details.exchange_completed')}
                </p>
              </div>
            )}
          </div>

          {/* Review Section - Shows for completed exchanges */}
          {exchange.status === "completed" && (
            <Card className="mt-6 p-0 overflow-hidden backdrop-blur-sm bg-[#FDFBF7]/80 dark:bg-[#2e2c28]/80 shadow-xl border border-[#EFEAC6] dark:border-[#4a463a] hover:shadow-2xl transition-all duration-300">
              <div className="p-6 border-b border-[#EFEAC6] dark:border-[#4a463a] bg-[#FFFBE6] dark:bg-[#2C2A25]">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#A88C8F] dark:bg-[#7a6466] text-white shadow-lg">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[#594a42] dark:text-[#d6c7b0]">
                      {t('exchanges.details.reviews.title')}
                    </h2>
                    <p className="text-sm text-[#879385] dark:text-[#998676] mt-1">
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
                  partnerAvatar={partner?.avatarUrl}
                  existingReviewByUser={existingReviewByUser}
                  existingReviewByPartner={existingReviewByPartner}
                  onReviewSubmit={handleReviewSubmit}
                />
              </div>
            </Card>
          )}

          {/* Chat Section - Show if accepted or completed */}
          {(exchange.status === "accepted" || exchange.status === "completed") && (
            <Card className="mt-6 p-0 overflow-hidden backdrop-blur-sm bg-[#FDFBF7]/80 dark:bg-[#2e2c28]/80 shadow-xl border border-[#EFEAC6] dark:border-[#4a463a] hover:shadow-2xl transition-all duration-300">
              <div className="p-6 border-b border-[#EFEAC6] dark:border-[#4a463a] bg-[#FFFBE6] dark:bg-[#2C2A25]">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#879385] dark:bg-[#525b51] text-white shadow-lg">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[#594a42] dark:text-[#d6c7b0]">
                      {t('exchanges.details.chat.title', { name: partner?.name })}
                    </h2>
                    <p className="text-sm text-[#879385] dark:text-[#998676] mt-1">
                      {t('exchanges.details.chat.subtitle')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="h-[400px] overflow-y-auto p-4 space-y-4 bg-[#FDFBF7]/50 dark:bg-[#2e2c28]/50">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-[#879385] dark:text-[#998676] space-y-3">
                    <div className="p-4 rounded-full bg-[#EFEAC6] dark:bg-[#4a463a]">
                      <MessageSquare className="w-8 h-8 text-[#594a42] dark:text-[#d6c7b0]" />
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
                            ? "bg-[#A88C8F] dark:bg-[#7a6466] text-white rounded-tr-none"
                            : "bg-white dark:bg-[#4a463a] text-[#594a42] dark:text-[#d6c7b0] rounded-tl-none border border-[#EFEAC6] dark:border-[#5e5a4b]"
                            }`}
                        >
                          <p className="text-sm">{msg.text}</p>
                          <p className={`text-[10px] mt-1 ${isMe ? "text-white/80" : "text-[#879385] dark:text-[#998676]"}`}>
                            {formatDate(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 bg-[#FDFBF7] dark:bg-[#2e2c28] border-t border-[#EFEAC6] dark:border-[#4a463a]">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={t('exchanges.details.chat.placeholder')}
                    className="flex-1 bg-white dark:bg-[#4a463a] border-[#EFEAC6] dark:border-[#5e5a4b] text-[#594a42] dark:text-[#d6c7b0]"
                  />
                  <Button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="bg-[#A88C8F] hover:bg-[#997b7e] text-white shadow-md hover:shadow-lg transition-all duration-300"
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
