"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
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
import { useCurrentLocale, useI18n } from "@/locales/provider";
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
  const locale = useCurrentLocale();
  const exchangeId = params.exchangeId as string;
  const { exchange, loading, messages, sendMessage, updateStatus } = useExchangeDetails(exchangeId);
  const [newMessage, setNewMessage] = useState("");
  const { markEntityNotificationsAsRead, notifications } = useNotifications();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mark notifications for this exchange as read as they arrive
  useEffect(() => {
    if (exchangeId) {
      markEntityNotificationsAsRead(exchangeId);
    }
  }, [exchangeId, notifications, markEntityNotificationsAsRead]);

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
      case 'chat':
        return <MessageSquare className="w-5 h-5" />;
      default:
        return <Package className="w-5 h-5" />;
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-[#EFEAC6] text-[#594a42] border border-[#D4CFAE]';
      case 'accepted':
        return 'bg-[#879385] text-white border border-[#6e796c]';
      case 'rejected':
        return 'bg-[#A88C8F] text-white border border-[#8e7679]';
      case 'completed':
        return 'bg-[#594a42] text-white border border-[#3e332e]';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (timestamp?: Timestamp) => {
    if (!timestamp) return '';
    return timestamp.toDate().toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', {
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
            <div className="p-8 bg-[#FDFBF7] dark:bg-[#2e2c28] border-none shadow-sm rounded-3xl h-96 animate-pulse">
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!exchange) {
    return (
      <main className="container mx-auto px-4 py-8 bg-[#FFFBE6] dark:bg-[#2C2A25] min-h-screen flex items-center justify-center">
        <div className="p-12 text-center bg-[#FDFBF7] dark:bg-[#2e2c28] max-w-md w-full border-none shadow-xl rounded-[2rem]">
          <div className="mb-6 p-4 bg-[#A88C8F]/10 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
            <XCircle className="w-10 h-10 text-[#A88C8F]" />
          </div>
          <h2 className="text-2xl font-bold text-[#594a42] dark:text-[#d6c7b0] mb-3">{t('exchanges.details.toast.exchange_not_found')}</h2>
          <Button onClick={() => router.push("/exchanges")} className="mt-6 bg-[#A88C8F] hover:bg-[#8e7679] text-white rounded-xl h-12 px-8 text-lg font-medium shadow-md transition-all hover:scale-105">
            {t('exchanges.details.back_to_exchanges')}
          </Button>
        </div>
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
    <main className="bg-[#FFFBE6] dark:bg-[#2C2A25] pb-16">
      {/* Organic Header */}
      <div className="bg-[#EFEAC6]/50 dark:bg-[#3E3B34]/50 border-b border-[#D4CFAE] dark:border-[#4a463a] py-4 sticky top-0 z-30 backdrop-blur-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 text-sm text-[#879385] font-medium tracking-wide">
            <Link href="/" className="hover:text-[#594a42] transition-colors">
              {t('exchanges.details.breadcrumb.home')}
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/exchanges" className="hover:text-[#594a42] transition-colors">
              {t('exchanges.details.breadcrumb.exchanges')}
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-[#594a42] dark:text-[#d6c7b0] font-bold truncate max-w-[200px]">
              {exchange.productName}
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">

        {/* Title Section */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/exchanges")}
                className="text-[#879385] hover:text-[#594a42] hover:bg-transparent p-0 h-auto"
              >
                <ArrowLeft className="w-5 h-5 mr-1" />
                <span className="text-base font-semibold">{t('common.back')}</span>
              </Button>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-[#2C2A25] dark:text-[#FFFBE6] tracking-tight leading-tight">
              {t('exchanges.details.title')}
            </h1>
            <div className="flex items-center gap-3 text-[#594a42]/70 dark:text-[#d6c7b0]/70 font-medium">
              <Calendar className="w-5 h-5" />
              {formatDate(exchange.createdAt)}
            </div>
          </div>

          <div className={`px-6 py-3 rounded-full flex items-center gap-3 shadow-sm border-2 ${exchange.status === 'pending' ? 'bg-[#FFF9C4] border-[#FBC02D] text-[#F9A825]' :
            exchange.status === 'accepted' ? 'bg-[#DCEDC8] border-[#8BC34A] text-[#558B2F]' :
              exchange.status === 'rejected' ? 'bg-[#FFCDD2] border-[#EF5350] text-[#C62828]' :
                'bg-[#D7CCC8] border-[#8D6E63] text-[#5D4037]'
            }`}>
            {exchange.status === 'pending' && <Clock className="w-5 h-5 animate-pulse" />}
            {exchange.status === 'accepted' && <CheckCircle className="w-5 h-5" />}
            {exchange.status === 'rejected' && <XCircle className="w-5 h-5" />}
            {exchange.status === 'completed' && <Package className="w-5 h-5" />}
            <span className="text-lg font-bold uppercase tracking-wide">
              {(t as any)(`exchanges.status.${exchange.status}`)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LEFT COLUMN */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-8">

            {/* Product Card - Organic Style */}
            <div
              className="relative bg-white dark:bg-[#3E3B34] p-2 shadow-xl transition-transform duration-300 hover:scale-[1.01]"
              style={{ borderRadius: '20px' }}
            >
              <div className="aspect-[4/3] w-full relative rounded-2xl overflow-hidden mb-4">
                {exchange.product?.imageUrls?.[0] ? (
                  <Image
                    src={exchange.product.imageUrls[0]}
                    alt={exchange.product.name || exchange.productName}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 40vw"
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-[#EFEAC6] text-[#879385]">
                    <Package className="w-16 h-16 opacity-50" />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <Badge className="bg-white/95 text-[#2C2A25] font-bold shadow-sm backdrop-blur-sm border-0">
                    {exchange.product?.category || "Product"}
                  </Badge>
                </div>
              </div>

              <div className="px-4 pb-4">
                <h3 className="font-black text-2xl text-[#2C2A25] dark:text-[#FFFBE6] leading-tight mb-2">
                  {exchange.productName}
                </h3>
                {exchange.product?.description && (
                  <p className="text-[#594a42] dark:text-[#A6C6B9] leading-relaxed mb-6">
                    {exchange.product.description}
                  </p>
                )}

                {!isOwner && (
                  <div className="flex items-center gap-4 bg-[#FDFBF7] dark:bg-[#2C2A25] p-3 rounded-xl border border-[#EFEAC6] dark:border-[#4a463a]">
                    <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                      <AvatarImage src={partner?.avatarUrl} />
                      <AvatarFallback>{partner?.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-[10px] text-[#879385] uppercase tracking-wider font-bold">
                        {t('exchanges.details.partner_info.owns')}
                      </p>
                      <p className="text-sm font-bold text-[#2C2A25] dark:text-[#FFFBE6]">
                        {partner?.name}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Offer Details Card - Organic Style */}
            <div
              className="relative bg-[#F0F4E8] dark:bg-[#2A3326] p-6 shadow-lg border-2 border-[#879385]/20 hover:shadow-xl transition-all"
              style={{ borderRadius: 'var(--radius-hand, 15px 225px 15px 255px / 255px 15px 225px 15px)' }}
            >
              <div className="flex items-center gap-3 mb-5 border-b border-[#879385]/10 pb-4">
                <div className="p-2 bg-[#879385]/20 rounded-full text-[#594a42] dark:text-white">
                  <Info className="w-5 h-5 text-[#4E5D4B]" />
                </div>
                <h3 className="text-lg font-bold text-[#4E5D4B] dark:text-[#DCEFD5]">
                  {t('exchanges.details.offer_details')}
                </h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white dark:bg-[#3E3B34] rounded-2xl text-[#879385] shadow-sm">
                    {getOfferTypeIcon(exchange.offer?.type)}
                  </div>
                  <div>
                    <p className="font-bold text-[#2C2A25] dark:text-[#FFFBE6] uppercase text-sm tracking-wide">
                      {t('exchanges.details.offer_label', { type: exchange.offer?.type === 'exchange' ? 'Intercambio' : 'Chat' })}
                    </p>
                    {exchange.offer?.type === "exchange" && exchange.offer.offeredProductName && (
                      <div className="mt-2 text-[#594a42] dark:text-[#A6C6B9] font-medium bg-white/50 dark:bg-black/10 p-2 rounded-lg inline-block">
                        <span className="block text-xs uppercase text-[#879385] mb-1">Ofreciendo:</span>
                        {exchange.offer.offeredProductName}
                      </div>
                    )}
                  </div>
                </div>

                {!isRequester && (
                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[#879385]/10">
                    <Avatar className="h-8 w-8 border-2 border-[#879385]/30">
                      <AvatarImage src={partner?.avatarUrl} />
                      <AvatarFallback>{partner?.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-[10px] text-[#4E5D4B] uppercase tracking-wider font-bold">
                        {t('exchanges.details.partner_info.requested_by')}
                      </p>
                      <p className="text-sm font-bold text-[#2C2A25] dark:text-[#FFFBE6]">
                        {partner?.name}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-8">

            {/* Action Area */}
            {exchange.status === "pending" && isOwner && (
              <div className="bg-[#FFF9C4]/50 dark:bg-[#FBC02D]/10 border-2 border-[#FBC02D] p-6 rounded-[2rem] shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[#FBC02D] text-[#594a42] rounded-full animate-bounce">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-[#594a42] dark:text-[#FFFBE6]">
                      {t('exchanges.item.action_required')}
                    </h3>
                    <p className="text-[#88784E]">
                      {partner?.name} está esperando tu respuesta.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                  <Button
                    onClick={handleRejectOffer}
                    variant="ghost"
                    className="flex-1 md:flex-none border-2 border-[#A88C8F] text-[#A88C8F] hover:bg-[#A88C8F] hover:text-white rounded-xl h-12 font-bold transition-all"
                  >
                    {t('exchanges.details.decline_offer')}
                  </Button>
                  <Button
                    onClick={handleAcceptOffer}
                    className="flex-1 md:flex-none bg-[#6B8E23] hover:bg-[#558B2F] text-white rounded-xl h-12 px-6 font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1"
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    {t('exchanges.details.accept_offer')}
                  </Button>
                </div>
              </div>
            )}

            {exchange.status === "accepted" && (
              <div className="bg-[#DCEDC8]/50 dark:bg-[#558B2F]/10 border-2 border-[#8BC34A] p-6 rounded-[2rem] shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[#8BC34A] text-white rounded-full">
                    <ArrowRightLeft className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-[#33691E] dark:text-[#DCEDC8]">
                      Intercambio en curso
                    </h3>
                    <p className="text-[#558B2F] dark:text-[#C5E1A5]">
                      Usa el chat para coordinar la entrega.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={async () => {
                    try {
                      await updateStatus('completed');
                      const recipientId = exchange.requesterId === user?.uid ? exchange.ownerId : exchange.requesterId;
                      const completeMetadata: NotificationMetadata = {};
                      if (exchange.productName) completeMetadata.productName = exchange.productName;
                      await createNotification({
                        recipientId,
                        senderId: user!.uid,
                        type: "EXCHANGE_COMPLETED",
                        entityId: exchange.id,
                        metadata: completeMetadata,
                      });
                      toast.success(t('exchanges.details.toast.exchange_completed'));
                    } catch (error) {
                      console.error("Error completing exchange:", error);
                      toast.error(t('exchanges.details.toast.failed_to_complete'));
                    }
                  }}
                  className="w-full md:w-auto bg-[#33691E] hover:bg-[#558B2F] text-white rounded-xl h-12 px-6 font-bold shadow-md hover:shadow-lg transition-all"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  {t('exchanges.details.mark_as_completed')}
                </Button>
              </div>
            )}

            {/* Chat Section */}
            {exchange.chatId && (
              <div className="bg-white dark:bg-[#3E3B34] rounded-[2.5rem] shadow-xl overflow-hidden border border-[#EFEAC6] dark:border-[#4a463a] h-[600px] flex flex-col relative w-full">
                {/* Chat Header */}
                <div className="bg-[#EFEAC6]/30 dark:bg-[#2C2A25]/50 p-4 border-b border-[#EFEAC6] dark:border-[#4a463a] flex items-center justify-between backdrop-blur-md">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="h-12 w-12 border-2 border-white shadow-md">
                        <AvatarImage src={partner?.avatarUrl} />
                        <AvatarFallback>{partner?.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full animate-pulse"></span>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-[#2C2A25] dark:text-[#d6c7b0] leading-none mb-1">
                        {partner?.name}
                      </h3>
                      <p className="text-xs text-[#879385] font-medium uppercase tracking-wide">
                        {t('exchanges.details.chat.subtitle')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-[#FFFBE6]/50 to-white/50 dark:from-[#2C2A25] dark:to-[#222]">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-[#879385] space-y-4 opacity-50">
                      <div className="p-6 bg-[#EFEAC6] rounded-full">
                        <MessageSquare className="w-10 h-10" />
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-lg text-[#594a42]">{t('exchanges.details.chat.no_messages')}</p>
                        <p className="text-sm">{t('exchanges.details.chat.start_conversation')}</p>
                      </div>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.senderId === user?.uid;
                      return (
                        <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm relative ${isMe
                            ? "bg-[#879385] text-white rounded-tr-none"
                            : "bg-white dark:bg-[#3d382d] text-[#2C2A25] dark:text-[#d6c7b0] rounded-tl-none border border-[#EFEAC6] dark:border-[#5e5a4b]"
                            }`}>
                            <p className="text-base leading-relaxed font-medium">{msg.text}</p>
                            <p className={`text-[10px] mt-2 text-right opacity-70 font-bold uppercase tracking-wider`}>
                              {formatDate(msg.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white dark:bg-[#2C2A25] border-t border-[#EFEAC6] dark:border-[#4a463a]">
                  <form onSubmit={handleSendMessage} className="flex gap-3 items-center bg-[#F9F9F9] dark:bg-[#1a1a1a] p-2 rounded-[2rem] border border-transparent focus-within:border-[#879385] transition-all shadow-inner">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={t('exchanges.details.chat.placeholder')}
                      className="flex-1 bg-transparent border-none focus-visible:ring-0 text-[#2C2A25] dark:text-[#FFFBE6] px-4 py-3 h-auto"
                    />
                    <Button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="rounded-full w-12 h-12 bg-[#879385] hover:bg-[#6e796c] text-white shadow-md flex-shrink-0"
                    >
                      <Send className="w-5 h-5 ml-0.5" />
                    </Button>
                  </form>
                </div>
              </div>
            )}

            {/* Review Section */}
            {exchange.status === "completed" && (
              <div className="bg-white dark:bg-[#3E3B34] p-8 rounded-[2rem] shadow-lg border border-[#EFEAC6] dark:border-[#4a463a]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-[#DCEDC8] rounded-full text-[#33691E]">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-black text-[#2C2A25] dark:text-[#FFFBE6]">
                    {t('exchanges.details.reviews.title')}
                  </h2>
                </div>
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
            )}

          </div>
        </div>
      </div>
    </main>
  );
}
