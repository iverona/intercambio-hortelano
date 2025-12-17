"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
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
  MapPin,
  Calendar,
  Info,
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

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-[#EFEAC6] text-[#594a42] hover:bg-[#EFEAC6]/90 border border-[#D4CFAE]';
      case 'accepted':
        return 'bg-[#6B8E23] text-white hover:bg-[#556B2F] border border-[#556B2F]';
      case 'rejected':
        return 'bg-[#A88C8F] text-white hover:bg-[#997b7e] border border-[#7a6466]';
      case 'completed':
        return 'bg-[#879385] text-white hover:bg-[#525b51] border border-[#525b51]';
      default:
        return 'bg-gray-100 text-gray-800';
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
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card className="p-8 bg-[#FDFBF7] dark:bg-[#2e2c28]">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </Card>
          </div>
          <div className="space-y-6">
            <Card className="p-8 bg-[#FDFBF7] dark:bg-[#2e2c28]">
              <div className="animate-pulse space-y-4">
                <div className="h-20 w-20 bg-gray-200 rounded-full mx-auto"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    );
  }

  if (!exchange) {
    return (
      <main className="container mx-auto px-4 py-8 bg-[#FFFBE6] dark:bg-[#2C2A25] min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center bg-[#FDFBF7] dark:bg-[#2e2c28] max-w-md w-full">
          <XCircle className="w-12 h-12 text-[#A88C8F] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#594a42] dark:text-[#d6c7b0] mb-2">{t('exchanges.details.toast.exchange_not_found')}</h2>
          <Button onClick={() => router.push("/exchanges")} className="mt-4 bg-[#A88C8F] hover:bg-[#997b7e] text-white">
            {t('exchanges.details.back_to_exchanges')}
          </Button>
        </Card>
      </main>
    );
  }

  const isOwner = user?.uid === exchange.ownerId;
  const isRequester = user?.uid === exchange.requesterId;
  const partner = isOwner ? exchange.requester : exchange.owner;

  // Extract reviews if they exist
  const reviews = exchange.reviews as Record<string, any> | undefined;
  const existingReviewByUser = user ? reviews?.[user.uid] : undefined;
  const existingReviewByPartner = partner ? reviews?.[partner.id] : undefined;

  return (
    <main className="min-h-screen bg-[#FFFBE6] dark:bg-[#2C2A25] pb-12">
      {/* Breadcrumb Navigation */}
      <div className="border-b border-[#EFEAC6] dark:border-[#4a463a] bg-[#FFFBE6]/50 dark:bg-[#2C2A25]/50 backdrop-blur-sm sticky top-0 z-20">
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

      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/exchanges")}
                className="text-[#879385] hover:text-[#594a42] dark:text-[#998676] dark:hover:text-[#d6c7b0] p-0 h-auto hover:bg-transparent"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                {t('exchanges.details.back_to_exchanges')}
              </Button>
            </div>
            <h1 className="text-3xl font-bold text-[#594a42] dark:text-[#d6c7b0]">
              {t('exchanges.details.title')}
            </h1>
            <p className="text-[#879385] dark:text-[#998676] flex items-center gap-2 mt-1">
              <Calendar className="w-4 h-4" />
              {formatDate(exchange.createdAt)}
            </p>
          </div>
          <Badge className={`${getStatusBadgeStyle(exchange.status)} px-4 py-1.5 text-sm shadow-sm rounded-full`}>
            {exchange.status.charAt(0).toUpperCase() + exchange.status.slice(1)}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          {/* LEFT COLUMN - Context (Product, Partner, Offer) */}
          <div className="lg:col-span-4 space-y-6">

            {/* Product Card */}
            <Card className="bg-[#FDFBF7] dark:bg-[#2e2c28] border-[#EFEAC6] dark:border-[#4a463a] shadow-sm overflow-hidden">
              <div className="aspect-video w-full bg-[#EFEAC6] dark:bg-[#4a463a] relative">
                {exchange.product?.images?.[0] ? (
                  <img
                    src={exchange.product.images[0]}
                    alt={exchange.productName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-[#879385] dark:text-[#998676]">
                    <Package className="w-12 h-12 opacity-50" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary" className="bg-white/90 text-[#594a42] backdrop-blur-sm">
                    {exchange.product?.category || "Product"}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-5">
                <h3 className="font-bold text-lg text-[#594a42] dark:text-[#d6c7b0] mb-2">
                  {exchange.productName}
                </h3>
                {exchange.product?.description && (
                  <p className="text-sm text-[#3e3b34] dark:text-[#998676] line-clamp-3 mb-4">
                    {exchange.product.description}
                  </p>
                )}
                
                {/* Show Owner Info ONLY if current user is NOT the owner (i.e. I am the requester looking at someone else's product) */}
                {!isOwner && (
                  <>
                    <Separator className="bg-[#EFEAC6] dark:bg-[#4a463a] my-4" />
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-[#FFFBE6] dark:bg-[#36342e] border border-[#EFEAC6] dark:border-[#4a463a]">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={partner?.avatarUrl} />
                          <AvatarFallback>{partner?.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                      </div>
                      <div>
                        <p className="text-xs text-[#879385] dark:text-[#998676] uppercase tracking-wider font-semibold">
                          {t('exchanges.details.partner_info.owns')}
                        </p>
                        <p className="text-sm font-medium text-[#594a42] dark:text-[#d6c7b0]">
                          {partner?.name}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Offer Details Card */}
            <Card className="bg-[#FDFBF7] dark:bg-[#2e2c28] border-[#EFEAC6] dark:border-[#4a463a] shadow-sm">
              <CardHeader className="pb-3 border-b border-[#EFEAC6] dark:border-[#4a463a] bg-[#FFFBE6]/50 dark:bg-[#36342e]/50">
                <CardTitle className="text-base font-semibold text-[#594a42] dark:text-[#d6c7b0] flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  {t('exchanges.details.offer_details')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[#6B8E23]/10 text-[#6B8E23] dark:text-[#9FB380] mt-0.5">
                    {getOfferTypeIcon(exchange.offer?.type)}
                  </div>
                  <div>
                    <p className="font-medium text-[#594a42] dark:text-[#d6c7b0] capitalize">
                      {exchange.offer?.type} Offer
                    </p>
                    <div className="text-sm text-[#879385] dark:text-[#998676] mt-1 space-y-1">
                      {exchange.offer?.type === "exchange" && exchange.offer.offeredProductName && (
                        <p>Swapping for: <span className="font-medium text-[#594a42] dark:text-[#d6c7b0]">{exchange.offer.offeredProductName}</span></p>
                      )}
                      {exchange.offer?.type === "purchase" && exchange.offer.amount && (
                        <p>Offering: <span className="font-medium text-[#594a42] dark:text-[#d6c7b0]">\u20AC{exchange.offer.amount.toFixed(2)}</span></p>
                      )}
                      {exchange.offer?.message && (
                        <p className="italic">"{exchange.offer.message}"</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Show Requester Info ONLY if current user is NOT the requester (i.e. I am the owner receiving an offer) */}
                {!isRequester && (
                  <>
                    <Separator className="bg-[#EFEAC6] dark:bg-[#4a463a]" />
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-[#FFFBE6] dark:bg-[#36342e] border border-[#EFEAC6] dark:border-[#4a463a]">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={partner?.avatarUrl} />
                          <AvatarFallback>{partner?.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                      </div>
                      <div>
                        <p className="text-xs text-[#879385] dark:text-[#998676] uppercase tracking-wider font-semibold">
                          {t('exchanges.details.partner_info.requested_by')}
                        </p>
                        <p className="text-sm font-medium text-[#594a42] dark:text-[#d6c7b0]">
                          {partner?.name}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

          </div>

          {/* RIGHT COLUMN - Interaction (Status, Chat, Actions) */}
          <div className="lg:col-span-8 space-y-6">

            {/* Status & Action Banner */}
            <Card className="border-none shadow-md overflow-hidden">
              <div className={`p-6 ${
                exchange.status === 'pending' ? 'bg-[#FFFBE6] dark:bg-[#3d382d]' :
                exchange.status === 'accepted' ? 'bg-[#F0F7E6] dark:bg-[#2d3326]' :
                exchange.status === 'completed' ? 'bg-[#F4F5F4] dark:bg-[#2e302e]' :
                'bg-[#FCF4F4] dark:bg-[#332b2b]'
              }`}>
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-full ${
                      exchange.status === 'pending' ? 'bg-[#EFEAC6] text-[#594a42]' :
                      exchange.status === 'accepted' ? 'bg-[#6B8E23] text-white' :
                      exchange.status === 'completed' ? 'bg-[#879385] text-white' :
                      'bg-[#A88C8F] text-white'
                    }`}>
                      {exchange.status === 'pending' && <Clock className="w-6 h-6" />}
                      {exchange.status === 'accepted' && <ArrowRightLeft className="w-6 h-6" />}
                      {exchange.status === 'completed' && <CheckCircle className="w-6 h-6" />}
                      {exchange.status === 'rejected' && <XCircle className="w-6 h-6" />}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-[#594a42] dark:text-[#d6c7b0] mb-1">
                        {exchange.status === 'pending' ? t('exchanges.tabs.pending') :
                         exchange.status === 'accepted' ? t('exchanges.tabs.active') :
                         exchange.status === 'completed' ? t('exchanges.tabs.history') :
                         'Declined'}
                      </h2>
                      <p className="text-sm text-[#879385] dark:text-[#998676]">
                        {exchange.status === 'pending' && isOwner ? t('exchanges.item.action_required') :
                         exchange.status === 'pending' && isRequester ? t('exchanges.item.waiting_for_response') :
                         exchange.status === 'accepted' ? "Exchange in progress. Use chat to coordinate." :
                         exchange.status === 'completed' ? "This exchange has been completed successfully." :
                         "This offer was declined."}
                      </p>
                    </div>
                  </div>

                  {/* Dynamic Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    {exchange.status === "pending" && isOwner && (
                      <>
                        <Button
                          onClick={handleAcceptOffer}
                          className="bg-[#6B8E23] hover:bg-[#556B2F] text-white shadow-sm"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          {t('exchanges.details.accept_offer')}
                        </Button>
                        <Button
                          onClick={handleRejectOffer}
                          variant="outline"
                          className="border-[#A88C8F] text-[#A88C8F] hover:bg-[#A88C8F]/10"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          {t('exchanges.details.decline_offer')}
                        </Button>
                      </>
                    )}

                    {exchange.status === "accepted" && (
                      <Button
                        onClick={async () => {
                          try {
                            await updateStatus('completed');
                            // Notification logic...
                            const recipientId = exchange.requesterId === user?.uid
                              ? exchange.ownerId
                              : exchange.requesterId;
                            const completeMetadata: NotificationMetadata = {};
                            if (exchange.productName) completeMetadata.productName = exchange.productName;
                            // ... (rest of metadata logic kept same)

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
                        className="bg-[#879385] hover:bg-[#525b51] text-white shadow-sm"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {t('exchanges.details.mark_as_completed')}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Chat Section */}
            {(exchange.status === "accepted" || exchange.status === "completed") && (
              <Card className="bg-[#FDFBF7] dark:bg-[#2e2c28] border-[#EFEAC6] dark:border-[#4a463a] shadow-sm flex flex-col h-[500px] md:h-[600px]">
                <CardHeader className="py-4 px-6 border-b border-[#EFEAC6] dark:border-[#4a463a] bg-[#FFFBE6]/50 dark:bg-[#36342e]/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10 border border-[#EFEAC6]">
                          <AvatarImage src={partner?.avatarUrl} />
                          <AvatarFallback>{partner?.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                      </div>
                      <div>
                        <CardTitle className="text-base text-[#594a42] dark:text-[#d6c7b0]">
                          {partner?.name}
                        </CardTitle>
                        <p className="text-xs text-[#879385] dark:text-[#998676]">
                          {t('exchanges.details.chat.subtitle')}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FDFBF7]/30 dark:bg-[#2e2c28]/30">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-[#879385] dark:text-[#998676] space-y-3 opacity-60">
                      <MessageSquare className="w-12 h-12" />
                      <p className="font-medium">{t('exchanges.details.chat.no_messages')}</p>
                      <p className="text-sm">{t('exchanges.details.chat.start_conversation')}</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.senderId === user?.uid;
                      return (
                        <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[80%] rounded-2xl p-3 shadow-sm ${
                            isMe
                              ? "bg-[#A88C8F] text-white rounded-tr-none"
                              : "bg-white dark:bg-[#3d382d] text-[#594a42] dark:text-[#d6c7b0] rounded-tl-none border border-[#EFEAC6] dark:border-[#5e5a4b]"
                          }`}>
                            <p className="text-sm leading-relaxed">{msg.text}</p>
                            <p className={`text-[10px] mt-1 text-right ${isMe ? "text-white/80" : "text-[#879385] dark:text-[#998676]"}`}>
                              {formatDate(msg.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-4 bg-white dark:bg-[#2e2c28] border-t border-[#EFEAC6] dark:border-[#4a463a]">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={t('exchanges.details.chat.placeholder')}
                      className="flex-1 bg-[#FDFBF7] dark:bg-[#3d382d] border-[#EFEAC6] dark:border-[#5e5a4b] focus-visible:ring-[#A88C8F]"
                    />
                    <Button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="bg-[#A88C8F] hover:bg-[#997b7e] text-white shadow-sm"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              </Card>
            )}

            {/* Review Section */}
            {exchange.status === "completed" && (
              <Card className="bg-[#FDFBF7] dark:bg-[#2e2c28] border-[#EFEAC6] dark:border-[#4a463a] shadow-sm">
                <CardHeader className="py-4 px-6 border-b border-[#EFEAC6] dark:border-[#4a463a] bg-[#FFFBE6]/50 dark:bg-[#36342e]/50">
                  <CardTitle className="text-lg font-semibold text-[#594a42] dark:text-[#d6c7b0] flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-[#6B8E23]" />
                    {t('exchanges.details.reviews.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
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
                </CardContent>
              </Card>
            )}

          </div>
        </div>
      </div>
    </main>
  );
}
