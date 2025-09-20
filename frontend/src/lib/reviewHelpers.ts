import { doc, updateDoc, getDoc, Timestamp, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { createNotification } from "./notifications";
import { Review } from "@/components/shared/ReviewSection";

interface SubmitReviewParams {
  exchangeId: string;
  rating: number;
  comment: string;
  currentUserId: string;
  reviewedUserId: string;
  exchangeProductName: string;
  currentUserName: string;
}

export async function submitReview({
  exchangeId,
  rating,
  comment,
  currentUserId,
  reviewedUserId,
  exchangeProductName,
  currentUserName,
}: SubmitReviewParams): Promise<void> {
  try {
    const exchangeRef = doc(db, "exchanges", exchangeId);
    
    // Create the review object with reviewedUserId for the Cloud Function
    const review: Review & { reviewedUserId: string } = {
      rating,
      comment: comment || "",
      reviewerId: currentUserId,
      reviewedUserId: reviewedUserId, // Added for Cloud Function to identify who is being reviewed
      createdAt: Timestamp.now(),
    };
    
    // Update the exchange document with the review
    // Using the reviewer's ID as the key (the person who submitted the review)
    const updates: Record<string, Review & { reviewedUserId: string }> = {};
    updates[`reviews.${currentUserId}`] = review;
    
    await updateDoc(exchangeRef, updates);

    // The Cloud Function will automatically handle reputation updates
    // when it detects the new review in the exchange document
    console.log("Review submitted successfully. Reputation will be updated automatically.");

    // Send notification to the reviewed user
    await createNotification({
      recipientId: reviewedUserId,
      senderId: currentUserId,
      type: "REVIEW_RECEIVED",
      entityId: exchangeId,
      metadata: {
        productName: exchangeProductName,
        senderName: currentUserName,
        message: `Received a ${rating}-tomato review`,
      },
    });
  } catch (error) {
    console.error("Error submitting review:", error);
    throw error;
  }
}
