import { collection, addDoc, Timestamp, doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

export type NotificationType = 
  | "NEW_OFFER"
  | "OFFER_ACCEPTED"
  | "OFFER_REJECTED"
  | "MESSAGE_RECEIVED"
  | "EXCHANGE_COMPLETED";

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

interface CreateNotificationParams {
  recipientId: string;
  senderId: string;
  type: NotificationType;
  entityId: string; // ID of the related listing, exchange, or chat
  metadata?: NotificationMetadata;
}

export async function createNotification({
  recipientId,
  senderId,
  type,
  entityId,
  metadata = {},
}: CreateNotificationParams) {
  try {
    // Fetch sender's name if not provided
    if (!metadata.senderName) {
      const senderDoc = await getDoc(doc(db, "users", senderId));
      if (senderDoc.exists()) {
        metadata.senderName = senderDoc.data().displayName || senderDoc.data().name || "Someone";
      }
    }

    // Clean metadata to remove undefined values (Firebase doesn't accept undefined)
    const cleanMetadata: NotificationMetadata = {};
    Object.entries(metadata).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        (cleanMetadata as any)[key] = value;
      }
    });

    const notificationData = {
      recipientId,
      senderId,
      type,
      entityId,
      isRead: false,
      createdAt: Timestamp.now(),
      metadata: cleanMetadata, // Store cleaned contextual information
    };

    const docRef = await addDoc(collection(db, "notifications"), notificationData);
    console.log("Notification created with ID: ", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error creating notification: ", error);
    throw error;
  }
}

// Helper function to mark a notification as read
export async function markNotificationAsRead(notificationId: string) {
  try {
    const notificationRef = doc(db, "notifications", notificationId);
    await updateDoc(notificationRef, {
      isRead: true
    });
    console.log("Notification marked as read");
  } catch (error) {
    console.error("Error marking notification as read: ", error);
    throw error;
  }
}
