import { collection, addDoc, Timestamp, doc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

export type NotificationType = 
  | "NEW_PROPOSAL"
  | "PROPOSAL_ACCEPTED"
  | "PROPOSAL_REJECTED"
  | "NEW_MESSAGE"
  | "EXCHANGE_COMPLETED";

interface CreateNotificationParams {
  recipientId: string;
  senderId: string;
  type: NotificationType;
  entityId: string; // ID of the related listing, exchange, or chat
}

export async function createNotification({
  recipientId,
  senderId,
  type,
  entityId,
}: CreateNotificationParams) {
  try {
    const notificationData = {
      recipientId,
      senderId,
      type,
      entityId,
      isRead: false,
      createdAt: Timestamp.now(),
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
