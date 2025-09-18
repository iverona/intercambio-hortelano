"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import { toast } from "sonner";
import { collection, query, where, onSnapshot, orderBy, Timestamp, doc, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthContext";

interface NotificationMetadata {
  productName?: string;
  productId?: string;
  offeredProductName?: string;
  offeredProductId?: string;
  offerAmount?: number;
  offerType?: "exchange" | "purchase" | "chat";
  senderName?: string;
  message?: string;
}

interface Notification {
  id: string;
  recipientId: string;
  senderId: string;
  type: string;
  entityId: string;
  isRead: boolean;
  createdAt: Date;
  metadata?: NotificationMetadata;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const previousCountRef = useRef(0);

  useEffect(() => {
    // Clear notifications when user logs out
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      previousCountRef.current = 0;
      return;
    }
    
    // Set up the query for the logged-in user
    const q = query(
      collection(db, "notifications"),
      where("recipientId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
        const newNotifications: Notification[] = [];
        let newUnreadCount = 0;
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          const notification: Notification = {
            id: doc.id,
            recipientId: data.recipientId,
            senderId: data.senderId,
            type: data.type,
            entityId: data.entityId,
            isRead: data.isRead || false,
            createdAt: data.createdAt instanceof Timestamp 
              ? data.createdAt.toDate() 
              : new Date(data.createdAt),
            metadata: data.metadata || {},
          };
          newNotifications.push(notification);
          if (!notification.isRead) {
            newUnreadCount++;
          }
        });

        // Show toast for new, unread notifications with specific content
        // Only show if the count increased (not on initial load)
        if (previousCountRef.current > 0 && newNotifications.length > previousCountRef.current) {
          const latestNotification = newNotifications[0];
          if (!latestNotification.isRead) {
            // Create a specific message based on notification type and metadata
            let toastMessage = "You have a new notification!";
            const metadata = latestNotification.metadata;
            
            switch (latestNotification.type) {
              case "NEW_OFFER":
              case "NEW_PROPOSAL": // Handle old type
                if (metadata?.offerType === "exchange" && metadata?.offeredProductName) {
                  toastMessage = `New exchange offer: ${metadata.offeredProductName} for your ${metadata.productName}`;
                } else if (metadata?.offerType === "purchase" && metadata?.offerAmount) {
                  toastMessage = `New purchase offer: €${metadata.offerAmount.toFixed(2)} for your ${metadata.productName}`;
                } else if (metadata?.offerType === "chat") {
                  toastMessage = `Someone wants to chat about your ${metadata.productName}`;
                } else {
                  toastMessage = `New offer for your ${metadata?.productName || "product"}`;
                }
                break;
              case "OFFER_ACCEPTED":
              case "PROPOSAL_ACCEPTED": // Handle old type
                toastMessage = `Your offer for ${metadata?.productName || "a product"} was accepted!`;
                break;
              case "OFFER_REJECTED":
              case "PROPOSAL_REJECTED": // Handle old type
                toastMessage = `Your offer for ${metadata?.productName || "a product"} was declined`;
                break;
              case "MESSAGE_RECEIVED":
              case "NEW_MESSAGE": // Handle old type
                toastMessage = `New message from ${metadata?.senderName || "someone"}`;
                break;
              case "EXCHANGE_COMPLETED":
                toastMessage = `Exchange completed for ${metadata?.productName || "your product"}`;
                break;
            }
            
            toast.info(toastMessage);
          }
        }
        
        previousCountRef.current = newNotifications.length;
        setNotifications(newNotifications);
        setUnreadCount(newUnreadCount);
      },
      (error) => {
        console.error("Error fetching notifications:", error);
        
        // Handle permission errors gracefully
        if (error.code === 'permission-denied') {
          // This can happen during auth state changes, ignore silently
        }
      }
    );

    return () => unsubscribe();
  }, [user]); // Only depend on user, not notifications.length

  // Mark a single notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const notificationRef = doc(db, "notifications", notificationId);
      await updateDoc(notificationRef, {
        isRead: true
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error("Failed to mark notification as read");
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (notifications.length === 0 || unreadCount === 0) return;

    try {
      const batch = writeBatch(db);
      
      notifications.forEach((notification) => {
        if (!notification.isRead) {
          const notificationRef = doc(db, "notifications", notification.id);
          batch.update(notificationRef, { isRead: true });
        }
      });

      await batch.commit();
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast.error("Failed to mark notifications as read");
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};
