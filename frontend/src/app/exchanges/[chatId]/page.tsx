"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  Timestamp,
  updateDoc,
  where,
  getDocs,
} from "firebase/firestore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRightLeft, DollarSign, MessageSquare, Package, CheckCircle, XCircle } from "lucide-react";
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
  status: string;
  requesterId: string;
  ownerId: string;
  offer?: {
    type: "exchange" | "purchase" | "chat";
    offeredProductId?: string;
    offeredProductName?: string;
    amount?: number;
    message?: string;
  };
}

export default function ChatPage() {
  const { user } = useAuth();
  const params = useParams();
  const chatId = params.chatId as string;
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatPartner, setChatPartner] = useState<{
    id: string;
    displayName: string;
  } | null>(null);
  const [listingTitle, setListingTitle] = useState("");
  const [listingId, setListingId] = useState("");
  const [relatedExchange, setRelatedExchange] = useState<Exchange | null>(null);

  useEffect(() => {
    if (!chatId) return;

    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[];
      setMessages(msgs);
    });

    // Fetch chat details to get partner and listing info
    const chatRef = doc(db, "chats", chatId);
    getDoc(chatRef).then(async (chatSnap) => {
      if (chatSnap.exists()) {
        const chatData = chatSnap.data();
        setListingTitle(chatData.listingTitle);
        setListingId(chatData.listingId);
        
        const partnerId = chatData.participants.find((p: string) => p !== user?.uid);
        if (partnerId) {
          const userRef = doc(db, "users", partnerId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setChatPartner({
              id: userSnap.id,
              displayName: userSnap.data().displayName,
            });
          }
        }
        
        // Check for related exchange
        if (chatData.listingId) {
          const exchangesRef = collection(db, "exchanges");
          const q = query(
            exchangesRef,
            where("productId", "==", chatData.listingId)
          );
          const querySnapshot = await getDocs(q);
          
          querySnapshot.forEach((doc) => {
            const exchangeData = doc.data();
            // Check if this exchange involves the current user
            if (
              exchangeData.requesterId === user?.uid ||
              exchangeData.ownerId === user?.uid ||
              exchangeData.buyerId === user?.uid ||
              exchangeData.sellerId === user?.uid
            ) {
              setRelatedExchange({
                id: doc.id,
                ...exchangeData,
              } as Exchange);
            }
          });
        }
      }
    });

    return () => unsubscribe();
  }, [chatId, user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === "" || !user) return;

    const messagesRef = collection(db, "chats", chatId, "messages");
    const chatRef = doc(db, "chats", chatId);

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
    if (chatPartner) {
      const messageMetadata: any = {};
      
      // Only add fields that have values
      const senderName = user.displayName || user.email || "Someone";
      if (senderName) {
        messageMetadata.senderName = senderName;
      }
      if (newMessage) {
        messageMetadata.message = newMessage.substring(0, 100); // First 100 chars of message
      }

      await createNotification({
        recipientId: chatPartner.id,
        senderId: user.uid,
        type: "MESSAGE_RECEIVED",
        entityId: chatId,
        metadata: messageMetadata,
      });
    }

    setNewMessage("");
  };

  const handleAcceptOffer = async () => {
    if (!relatedExchange || !user) return;

    try {
      // Update exchange status
      const exchangeRef = doc(db, "exchanges", relatedExchange.id);
      await updateDoc(exchangeRef, {
        status: "accepted",
        updatedAt: serverTimestamp(),
      });

      // Send notification to the requester
      const recipientId = relatedExchange.requesterId === user.uid 
        ? relatedExchange.ownerId 
        : relatedExchange.requesterId;

      // Build complete metadata for the notification
      const acceptMetadata: any = {};
      if (relatedExchange.productName) {
        acceptMetadata.productName = relatedExchange.productName;
      }
      if (relatedExchange.productId) {
        acceptMetadata.productId = relatedExchange.productId;
      }
      // Add offer details if available
      if (relatedExchange.offer) {
        acceptMetadata.offerType = relatedExchange.offer.type;
        if (relatedExchange.offer.offeredProductName) {
          acceptMetadata.offeredProductName = relatedExchange.offer.offeredProductName;
        }
        if (relatedExchange.offer.amount) {
          acceptMetadata.offerAmount = relatedExchange.offer.amount;
        }
      }

      await createNotification({
        recipientId,
        senderId: user.uid,
        type: "OFFER_ACCEPTED",
        entityId: chatId, // Use chatId to navigate to the chat
        metadata: acceptMetadata,
      });

      toast.success("Offer accepted successfully!");
      
      // Reload exchange data
      const updatedDoc = await getDoc(exchangeRef);
      if (updatedDoc.exists()) {
        setRelatedExchange({
          id: updatedDoc.id,
          ...updatedDoc.data(),
        } as Exchange);
      }
    } catch (error) {
      console.error("Error accepting offer:", error);
      toast.error("Failed to accept offer");
    }
  };

  const handleRejectOffer = async () => {
    if (!relatedExchange || !user) return;

    try {
      // Update exchange status
      const exchangeRef = doc(db, "exchanges", relatedExchange.id);
      await updateDoc(exchangeRef, {
        status: "rejected",
        updatedAt: serverTimestamp(),
      });

      // Send notification to the requester
      const recipientId = relatedExchange.requesterId === user.uid 
        ? relatedExchange.ownerId 
        : relatedExchange.requesterId;

      // Build complete metadata for the notification
      const rejectMetadata: any = {};
      if (relatedExchange.productName) {
        rejectMetadata.productName = relatedExchange.productName;
      }
      if (relatedExchange.productId) {
        rejectMetadata.productId = relatedExchange.productId;
      }
      // Add offer details if available
      if (relatedExchange.offer) {
        rejectMetadata.offerType = relatedExchange.offer.type;
        if (relatedExchange.offer.offeredProductName) {
          rejectMetadata.offeredProductName = relatedExchange.offer.offeredProductName;
        }
        if (relatedExchange.offer.amount) {
          rejectMetadata.offerAmount = relatedExchange.offer.amount;
        }
      }

      await createNotification({
        recipientId,
        senderId: user.uid,
        type: "OFFER_REJECTED",
        entityId: chatId, // Use chatId to navigate to the chat
        metadata: rejectMetadata,
      });

      toast.info("Offer declined");
      
      // Reload exchange data
      const updatedDoc = await getDoc(exchangeRef);
      if (updatedDoc.exists()) {
        setRelatedExchange({
          id: updatedDoc.id,
          ...updatedDoc.data(),
        } as Exchange);
      }
    } catch (error) {
      console.error("Error rejecting offer:", error);
      toast.error("Failed to decline offer");
    }
  };

  const handleCompleteExchange = async () => {
    if (!relatedExchange || !user) return;

    try {
      // Update exchange status
      const exchangeRef = doc(db, "exchanges", relatedExchange.id);
      await updateDoc(exchangeRef, {
        status: "completed",
        completedAt: serverTimestamp(),
      });

      // Send notification to the other party
      const recipientId = relatedExchange.requesterId === user.uid 
        ? relatedExchange.ownerId 
        : relatedExchange.requesterId;

      // Build complete metadata for the notification
      const completeMetadata: any = {};
      if (relatedExchange.productName) {
        completeMetadata.productName = relatedExchange.productName;
      }
      if (relatedExchange.productId) {
        completeMetadata.productId = relatedExchange.productId;
      }
      // Add offer details if available
      if (relatedExchange.offer) {
        completeMetadata.offerType = relatedExchange.offer.type;
        if (relatedExchange.offer.offeredProductName) {
          completeMetadata.offeredProductName = relatedExchange.offer.offeredProductName;
        }
        if (relatedExchange.offer.amount) {
          completeMetadata.offerAmount = relatedExchange.offer.amount;
        }
      }

      await createNotification({
        recipientId,
        senderId: user.uid,
        type: "EXCHANGE_COMPLETED",
        entityId: chatId, // Use chatId to navigate to the chat
        metadata: completeMetadata,
      });

      toast.success("Exchange marked as completed!");
      
      // Reload exchange data
      const updatedDoc = await getDoc(exchangeRef);
      if (updatedDoc.exists()) {
        setRelatedExchange({
          id: updatedDoc.id,
          ...updatedDoc.data(),
        } as Exchange);
      }
    } catch (error) {
      console.error("Error completing exchange:", error);
      toast.error("Failed to complete exchange");
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

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Exchange Context Header */}
        {relatedExchange && (
          <Card className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200 dark:border-blue-800">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {relatedExchange.offer && getOfferTypeIcon(relatedExchange.offer.type)}
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    Exchange Proposal
                  </h3>
                </div>
                
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                  <span className="font-medium">Product:</span> {relatedExchange.productName}
                </p>
                
                {relatedExchange.offer && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    <span className="font-medium">Offer:</span>{" "}
                    {relatedExchange.offer.type === "exchange" && relatedExchange.offer.offeredProductName
                      ? `${relatedExchange.offer.offeredProductName} (Exchange)`
                      : relatedExchange.offer.type === "purchase" && relatedExchange.offer.amount
                      ? `€${relatedExchange.offer.amount.toFixed(2)} (Purchase)`
                      : "Discussion"}
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Badge className={`${getStatusColor(relatedExchange.status)} border-0`}>
                  {relatedExchange.status.charAt(0).toUpperCase() + relatedExchange.status.slice(1)}
                </Badge>
              </div>
            </div>
            
            {/* Action buttons for pending offers */}
            {relatedExchange.status === "pending" && user && (
              <div className="flex gap-2 mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                {relatedExchange.ownerId === user.uid ? (
                  // Product owner can accept/reject
                  <>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={handleAcceptOffer}
                      className="flex-1"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Accept Offer
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleRejectOffer}
                      className="flex-1"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Decline
                    </Button>
                  </>
                ) : (
                  // Requester sees waiting status
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Waiting for response from the owner...
                  </p>
                )}
              </div>
            )}
            
            {/* Complete button for accepted exchanges */}
            {relatedExchange.status === "accepted" && user && (
              <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleCompleteExchange}
                  className="w-full"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Mark as Completed
                </Button>
              </div>
            )}
          </Card>
        )}
        
        <div className="border rounded-lg">
          <div className="p-4 border-b">
            <h1 className="text-xl font-bold">
              Chat with {chatPartner?.displayName || "..."}
            </h1>
            <p className="text-sm text-gray-500">
              Regarding: {listingTitle || "..."}
            </p>
          </div>
          <div className="p-4 h-96 overflow-y-auto flex flex-col space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.senderId === user?.uid ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`rounded-lg px-4 py-2 max-w-xs ${
                    msg.senderId === user?.uid
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t">
            <form onSubmit={handleSendMessage} className="flex space-x-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
              />
              <Button type="submit">Send</Button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
