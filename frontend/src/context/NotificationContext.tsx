"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import { toast } from "sonner";
import { collection, query, where, onSnapshot, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthContext";

interface Notification {
  id: string;
  recipientId: string;
  senderId: string;
  type: string;
  entityId: string;
  isRead: boolean;
  createdAt: Date;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const previousCountRef = useRef(0);

  useEffect(() => {
    console.log("NotificationProvider useEffect - user:", user?.uid);
    
    // Clear notifications when user logs out
    if (!user) {
      console.log("No user, clearing notifications");
      setNotifications([]);
      setUnreadCount(0);
      previousCountRef.current = 0;
      return;
    }

    console.log("Setting up notification listener for user:", user.uid);
    
    // Set up the query for the logged-in user
    const q = query(
      collection(db, "notifications"),
      where("recipientId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
        console.log("Notification snapshot received, size:", snapshot.size);
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
          };
          newNotifications.push(notification);
          if (!notification.isRead) {
            newUnreadCount++;
          }
        });

        // Show toast for new, unread notifications
        // Only show if the count increased (not on initial load)
        if (previousCountRef.current > 0 && newNotifications.length > previousCountRef.current) {
          const latestNotification = newNotifications[0];
          if (!latestNotification.isRead) {
            toast.info(`You have a new notification!`);
          }
        }
        
        previousCountRef.current = newNotifications.length;
        setNotifications(newNotifications);
        setUnreadCount(newUnreadCount);
      },
      (error) => {
        console.error("Error fetching notifications:", error);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        console.error("Current user ID:", user?.uid);
        
        // Handle permission errors gracefully
        if (error.code === 'permission-denied') {
          console.log("Permission denied for notifications. User may not be authenticated yet.");
          console.log("Auth state - user exists:", !!user);
          console.log("Auth state - user ID:", user?.uid);
        }
      }
    );

    return () => unsubscribe();
  }, [user]); // Only depend on user, not notifications.length

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount }}>
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
