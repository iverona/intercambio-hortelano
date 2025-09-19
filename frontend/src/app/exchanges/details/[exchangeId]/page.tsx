"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  addDoc,
  collection,
  Timestamp,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
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
} from "lucide-react";
import { createNotification } from "@/lib/notifications";
import { toast } from "sonner";

interface Message {
  id: string;
  text: string;
  senderId: string;
  createdAt: Timestamp;
}

interface Exchange {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
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
  requester?: {
    id: string;
    name: string;
    avatarUrl: string;
  };
  owner?: {
    id: string;
    name: string;
    avatarUrl: string;
  };
  product?: {
    id: string;
    title: string;
    description: string;
    images: string[];
    category: string;
    condition: string;
  };
}

export default function ExchangeDetailsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const exchangeId = params.exchangeId as string;
  const [exchange, setExchange] = useState<Exchange | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!exchangeId || !user) return;

    loadExchangeDetails();
  }, [exchangeId, user]);

  // Set up chat listener when exchange has a chatId
  useEffect(() => {
    if (!exchange?.chatId || !user) return;

    const messagesRef = collection(db, "chats", exchange.chatId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[];
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [exchange?.chatId, user]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadExchangeDetails = async () => {
    if (!user) return;

    try {
      // Get exchange document
      const exchangeDoc = await getDoc(doc(db, "exchanges", exchangeId));
      
      if (!exchangeDoc.exists()) {
        toast.error("Exchange not found");
        router.push("/exchanges");
        return;
      }

      const exchangeData = exchangeDoc.data();
      const exchangeInfo: Exchange = {
        id: exchangeDoc.id,
        ...exchangeData,
      } as Exchange;

      // Get requester info
      const requesterDoc = await getDoc(doc(db, "users", exchangeData.requesterId));
      if (requesterDoc.exists()) {
        const requesterData = requesterDoc.data();
        exchangeInfo.requester = {
          id: exchangeData.requesterId,
          name: requesterData.name || requesterData.displayName || "Unknown User",
          avatarUrl: requesterData.avatarUrl || "",
        };
      }

      // Get owner info
      const ownerDoc = await getDoc(doc(db, "users", exchangeData.ownerId));
      if (ownerDoc.exists()) {
        const ownerData = ownerDoc.data();
        exchangeInfo.owner = {
          id: exchangeData.ownerId,
          name: ownerData.name || ownerData.displayName || "Unknown User",
          avatarUrl: ownerData.avatarUrl || "",
        };
      }

      // Get product details
      if (exchangeData.productId) {
        const productDoc = await getDoc(doc(db, "products", exchangeData.productId));
        if (productDoc.exists()) {
          const productData = productDoc.data();
          exchangeInfo.product = {
            id: exchangeData.productId,
            title: productData.title,
            description: productData.description,
            images: productData.images || [],
            category: productData.category,
            condition: productData.condition,
          };
        }
      }

      setExchange(exchangeInfo);
      setLoading(false);
      
      // Log exchange state for debugging
      console.log("Exchange loaded:", {
        id: exchangeInfo.id,
        status: exchangeInfo.status,
        chatId: exchangeInfo.chatId,
        isOwner: user.uid === exchangeInfo.ownerId,
        isRequester: user.uid === exchangeInfo.requesterId
      });
    } catch (error) {
      console.error("Error loading exchange details:", error);
      toast.error("Failed to load exchange details");
      setLoading(false);
    }
  };

  const handleAcceptOffer = async () => {
    if (!exchange || !user) return;

    try {
      // Update exchange status to accepted (chat already exists)
      const exchangeRef = doc(db, "exchanges", exchange.id);
      await updateDoc(exchangeRef, {
        status: "accepted",
        updatedAt: serverTimestamp(),
      });

      // Send notification to the requester
      const acceptMetadata: any = {};
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

      toast.success("Offer accepted! Chat is now available below.");
      
      // Reload the exchange details to show the chat
      await loadExchangeDetails();
    } catch (error) {
      console.error("Error accepting offer:", error);
      toast.error("Failed to accept offer");
    }
  };

  const handleRejectOffer = async () => {
    if (!exchange || !user) return;

    try {
      // Update exchange status
      const exchangeRef = doc(db, "exchanges", exchange.id);
      await updateDoc(exchangeRef, {
        status: "rejected",
        updatedAt: serverTimestamp(),
      });

      // Send notification to the requester
      const rejectMetadata: any = {};
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

      toast.info("Offer declined");
      
      // Reload exchange data
      await loadExchangeDetails();
    } catch (error) {
      console.error("Error rejecting offer:", error);
      toast.error("Failed to decline offer");
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exchange?.chatId || newMessage.trim() === "" || !user) return;

    const messagesRef = collection(db, "chats", exchange.chatId, "messages");
    const chatRef = doc(db, "chats", exchange.chatId);

    try {
      // Add the new message to the messages subcollection
      await addDoc(messagesRef, {
        text: newMessage,
        senderId: user.uid,
        createdAt: serverTimestamp(),
      });

      // Update the lastMessage field on the parent chat document
      await updateDoc(chatRef, {
        lastMessage: {
          text: newMessage,
          createdAt: serverTimestamp(),
        },
      });

      // Send notification to the chat partner
      const partnerId = exchange.requesterId === user.uid ? exchange.ownerId : exchange.requesterId;
      const partner = exchange.requesterId === user.uid ? exchange.owner : exchange.requester;
      
      if (partnerId) {
        const messageMetadata: any = {};
        
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
      toast.error("Failed to send message");
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
            <p className="text-gray-500">Exchange not found</p>
            <Button onClick={() => router.push("/exchanges")} className="mt-4">
              Back to Exchanges
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
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => router.push("/exchanges")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Exchanges
        </Button>

        {/* Exchange Details Card */}
        <Card className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              {getOfferTypeIcon(exchange.offer?.type)}
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Exchange Details
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Created {formatDate(exchange.createdAt)}
                </p>
              </div>
            </div>
            <Badge className={`${getStatusColor(exchange.status)} border-0`}>
              {exchange.status.charAt(0).toUpperCase() + exchange.status.slice(1)}
            </Badge>
          </div>

          {/* Product Information */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Product Information
            </h2>
            {exchange.product && (
              <div className="space-y-2">
                {exchange.product.images.length > 0 && (
                  <img
                    src={exchange.product.images[0]}
                    alt={exchange.product.title}
                    className="w-full h-48 object-cover rounded-lg mb-3"
                  />
                )}
                <p className="text-sm">
                  <span className="font-medium">Title:</span> {exchange.product.title}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Category:</span> {exchange.product.category}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Condition:</span> {exchange.product.condition}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Description:</span> {exchange.product.description}
                </p>
              </div>
            )}
          </div>

          {/* Offer Details */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Offer Details
            </h2>
            <div className="space-y-2">
              {exchange.offer?.type === "exchange" && exchange.offer.offeredProductName && (
                <p className="text-sm">
                  <span className="font-medium">Type:</span> Exchange
                </p>
              )}
              {exchange.offer?.type === "exchange" && exchange.offer.offeredProductName && (
                <p className="text-sm">
                  <span className="font-medium">Offered Product:</span> {exchange.offer.offeredProductName}
                </p>
              )}
              {exchange.offer?.type === "purchase" && exchange.offer.amount && (
                <>
                  <p className="text-sm">
                    <span className="font-medium">Type:</span> Purchase
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Amount:</span> €{exchange.offer.amount.toFixed(2)}
                  </p>
                </>
              )}
              {exchange.offer?.type === "chat" && (
                <p className="text-sm">
                  <span className="font-medium">Type:</span> Chat Request
                </p>
              )}
              {exchange.offer?.message && (
                <p className="text-sm">
                  <span className="font-medium">Message:</span> {exchange.offer.message}
                </p>
              )}
            </div>
          </div>

          {/* Partner Information */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
              {isOwner ? "Requester" : "Owner"} Information
            </h2>
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={partner?.avatarUrl} alt={partner?.name} />
                <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-500 text-white">
                  {partner?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {partner?.name || "Unknown User"}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isOwner ? "Requested this exchange" : "Owns this product"}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {exchange.status === "pending" && isOwner && (
            <div className="flex gap-3">
              <Button
                onClick={handleAcceptOffer}
                className="flex-1"
                variant="default"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Accept Offer
              </Button>
              <Button
                onClick={handleRejectOffer}
                className="flex-1"
                variant="outline"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Decline Offer
              </Button>
            </div>
          )}

          {exchange.status === "pending" && isRequester && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg text-center">
              <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Waiting for the owner to respond to your offer
              </p>
            </div>
          )}

          {exchange.status === "accepted" && (
            <div className="space-y-3">
              <Button
                onClick={async () => {
                  if (!exchange || !user) return;
                  try {
                    const exchangeRef = doc(db, "exchanges", exchange.id);
                    await updateDoc(exchangeRef, {
                      status: "completed",
                      completedAt: serverTimestamp(),
                    });

                    // Send notification to the other party
                    const recipientId = exchange.requesterId === user.uid 
                      ? exchange.ownerId 
                      : exchange.requesterId;

                    const completeMetadata: any = {};
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
                      senderId: user.uid,
                      type: "EXCHANGE_COMPLETED",
                      entityId: exchange.chatId || exchange.id,
                      metadata: completeMetadata,
                    });

                    toast.success("Exchange marked as completed!");
                    await loadExchangeDetails();
                  } catch (error) {
                    console.error("Error completing exchange:", error);
                    toast.error("Failed to complete exchange");
                  }
                }}
                className="w-full"
                variant="outline"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark as Completed
              </Button>
            </div>
          )}

          {exchange.status === "rejected" && (
            <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg text-center">
              <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <p className="text-sm text-gray-700 dark:text-gray-300">
                This offer has been declined
              </p>
            </div>
          )}

          {exchange.status === "completed" && (
            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg text-center">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-gray-700 dark:text-gray-300">
                This exchange has been completed
              </p>
            </div>
          )}
        </Card>

        {/* Integrated Chat Section - Available for all exchanges */}
        {exchange?.chatId && (
          <Card className="mt-6 p-0 overflow-hidden">
            <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Chat with {partner?.name || "User"}
                </h2>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Discuss details about the exchange
              </p>
            </div>

            {/* Messages Area */}
            <div className="h-96 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900/50">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">No messages yet</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                      Start the conversation about your exchange
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => {
                    const isOwnMessage = msg.senderId === user?.uid;
                    const senderInfo = isOwnMessage 
                      ? { name: "You", avatarUrl: user?.photoURL || "" }
                      : msg.senderId === exchange.requesterId 
                        ? exchange.requester 
                        : exchange.owner;

                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${isOwnMessage ? "flex-row-reverse" : ""}`}
                      >
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarImage src={senderInfo?.avatarUrl || ""} />
                          <AvatarFallback className="text-xs">
                            {senderInfo?.name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`flex flex-col ${isOwnMessage ? "items-end" : "items-start"} max-w-[70%]`}>
                          <div
                            className={`rounded-lg px-4 py-2 ${
                              isOwnMessage
                                ? "bg-blue-500 text-white"
                                : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                            }`}
                          >
                            <p className="text-sm">{msg.text}</p>
                          </div>
                          <span className="text-xs text-gray-400 mt-1">
                            {msg.createdAt?.toDate?.()?.toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            }) || ""}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t bg-white dark:bg-gray-800">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1"
                />
                <Button type="submit" size="icon">
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </Card>
        )}
      </div>
    </main>
  );
}
