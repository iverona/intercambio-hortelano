"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createNotification, NotificationType } from "@/lib/notifications";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { ArrowRightLeft, DollarSign, MessageCircle, CheckCircle, XCircle, Package } from "lucide-react";

export default function TestNotificationsCompletePage() {
  const { user } = useAuth();
  const [recipientId, setRecipientId] = useState("");
  const [notificationType, setNotificationType] = useState<NotificationType>("NEW_OFFER");
  const [productName, setProductName] = useState("Organic Tomatoes");
  const [offeredProductName, setOfferedProductName] = useState("Fresh Lettuce");
  const [offerAmount, setOfferAmount] = useState("25.50");
  const [offerType, setOfferType] = useState<"exchange" | "purchase" | "chat">("exchange");
  const [message, setMessage] = useState("I'm interested in your product!");

  const sendTestNotification = async () => {
    if (!user) {
      toast.error("You must be logged in to send notifications");
      return;
    }

    if (!recipientId) {
      toast.error("Please enter a recipient ID");
      return;
    }

    try {
      // Build metadata based on notification type
      const metadata: any = {
        productName,
        productId: "test-product-123",
        senderName: user.displayName || user.email || "Test User",
      };

      // Add specific metadata based on notification type
      if (notificationType === "NEW_OFFER") {
        metadata.offerType = offerType;
        if (offerType === "exchange") {
          metadata.offeredProductName = offeredProductName;
          metadata.offeredProductId = "test-offered-product-456";
        } else if (offerType === "purchase") {
          metadata.offerAmount = parseFloat(offerAmount);
        }
        metadata.message = message;
      } else if (notificationType === "MESSAGE_RECEIVED") {
        metadata.message = message;
      }

      await createNotification({
        recipientId,
        senderId: user.uid,
        type: notificationType,
        entityId: "test-entity-" + Date.now(),
        metadata,
      });

      toast.success(`Test ${notificationType} notification sent successfully!`);
    } catch (error) {
      console.error("Error sending test notification:", error);
      toast.error("Failed to send test notification");
    }
  };

  const getNotificationPreview = () => {
    switch (notificationType) {
      case "NEW_OFFER":
        if (offerType === "exchange") {
          return `New exchange offer: ${offeredProductName} for your ${productName}`;
        } else if (offerType === "purchase") {
          return `New purchase offer: €${offerAmount} for your ${productName}`;
        } else {
          return `Someone wants to chat about your ${productName}`;
        }
      case "OFFER_ACCEPTED":
        return `Your offer for ${productName} was accepted!`;
      case "OFFER_REJECTED":
        return `Your offer for ${productName} was declined`;
      case "MESSAGE_RECEIVED":
        return `New message from ${user?.displayName || "someone"}: "${message.substring(0, 50)}..."`;
      case "EXCHANGE_COMPLETED":
        return `Exchange completed for ${productName}`;
      default:
        return "Unknown notification type";
    }
  };

  const getNotificationIcon = () => {
    switch (notificationType) {
      case "NEW_OFFER":
        if (offerType === "exchange") return <ArrowRightLeft className="w-5 h-5" />;
        if (offerType === "purchase") return <DollarSign className="w-5 h-5" />;
        return <MessageCircle className="w-5 h-5" />;
      case "OFFER_ACCEPTED":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "OFFER_REJECTED":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "MESSAGE_RECEIVED":
        return <MessageCircle className="w-5 h-5 text-purple-500" />;
      case "EXCHANGE_COMPLETED":
        return <ArrowRightLeft className="w-5 h-5 text-green-600" />;
      default:
        return <Package className="w-5 h-5" />;
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6">
          <p className="text-center text-gray-600">
            Please log in to test notifications
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Test Enhanced Notifications</h1>
      
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Current User Info</h2>
        <div className="space-y-2 text-sm">
          <p><span className="font-medium">User ID:</span> {user.uid}</p>
          <p><span className="font-medium">Email:</span> {user.email}</p>
          <p><span className="font-medium">Display Name:</span> {user.displayName || "Not set"}</p>
        </div>
      </Card>

      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Notification Configuration</h2>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="recipientId">Recipient User ID</Label>
            <Input
              id="recipientId"
              value={recipientId}
              onChange={(e) => setRecipientId(e.target.value)}
              placeholder="Enter the recipient's user ID"
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Tip: Use your own ID to send notifications to yourself for testing
            </p>
          </div>

          <div>
            <Label htmlFor="notificationType">Notification Type</Label>
            <Select value={notificationType} onValueChange={(value) => setNotificationType(value as NotificationType)}>
              <SelectTrigger id="notificationType" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NEW_OFFER">New Offer</SelectItem>
                <SelectItem value="OFFER_ACCEPTED">Offer Accepted</SelectItem>
                <SelectItem value="OFFER_REJECTED">Offer Rejected</SelectItem>
                <SelectItem value="MESSAGE_RECEIVED">Message Received</SelectItem>
                <SelectItem value="EXCHANGE_COMPLETED">Exchange Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="productName">Product Name</Label>
            <Input
              id="productName"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Enter product name"
              className="mt-1"
            />
          </div>

          {notificationType === "NEW_OFFER" && (
            <>
              <div>
                <Label htmlFor="offerType">Offer Type</Label>
                <Select value={offerType} onValueChange={(value) => setOfferType(value as "exchange" | "purchase" | "chat")}>
                  <SelectTrigger id="offerType" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exchange">Exchange</SelectItem>
                    <SelectItem value="purchase">Purchase</SelectItem>
                    <SelectItem value="chat">Chat</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {offerType === "exchange" && (
                <div>
                  <Label htmlFor="offeredProductName">Offered Product Name</Label>
                  <Input
                    id="offeredProductName"
                    value={offeredProductName}
                    onChange={(e) => setOfferedProductName(e.target.value)}
                    placeholder="Enter offered product name"
                    className="mt-1"
                  />
                </div>
              )}

              {offerType === "purchase" && (
                <div>
                  <Label htmlFor="offerAmount">Offer Amount (€)</Label>
                  <Input
                    id="offerAmount"
                    type="number"
                    step="0.01"
                    value={offerAmount}
                    onChange={(e) => setOfferAmount(e.target.value)}
                    placeholder="Enter offer amount"
                    className="mt-1"
                  />
                </div>
              )}
            </>
          )}

          {(notificationType === "NEW_OFFER" || notificationType === "MESSAGE_RECEIVED") && (
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter message content"
                className="mt-1"
                rows={3}
              />
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6 mb-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          {getNotificationIcon()}
          Notification Preview
        </h2>
        <div className="space-y-2">
          <p className="text-sm font-medium">Toast Message:</p>
          <p className="text-sm text-gray-700 dark:text-gray-300 italic">
            "{getNotificationPreview()}"
          </p>
        </div>
      </Card>

      <Button 
        onClick={sendTestNotification} 
        className="w-full"
        size="lg"
      >
        Send Test Notification
      </Button>

      <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <h3 className="font-medium mb-2">Testing Instructions:</h3>
        <ol className="text-sm space-y-1 list-decimal list-inside text-gray-600 dark:text-gray-400">
          <li>Copy your User ID from the info box above</li>
          <li>Paste it in the Recipient User ID field to send notifications to yourself</li>
          <li>Configure the notification type and details</li>
          <li>Click "Send Test Notification"</li>
          <li>Check the notification bell in the header to see the notification</li>
          <li>You should also see a toast message with the notification content</li>
        </ol>
      </div>
    </div>
  );
}
