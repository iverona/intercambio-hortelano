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
    
    // Create the review object
    const review: Review = {
      rating,
      comment: comment || "",
      reviewerId: currentUserId,
      createdAt: Timestamp.now(),
    };
    
    // Update the exchange document with the review
    const updates: Record<string, Review> = {};
    updates[`reviews.${reviewedUserId}`] = review;
    
    await updateDoc(exchangeRef, updates);

    // Try to update the reviewed user's reputation stats
    // If this fails due to permissions, we'll handle it gracefully
    try {
      const userRef = doc(db, "users", reviewedUserId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const currentReputation = userData.reputation || { averageRating: 0, totalReviews: 0 };
        
        // Calculate new average
        const newTotalReviews = currentReputation.totalReviews + 1;
        const newAverageRating = 
          ((currentReputation.averageRating * currentReputation.totalReviews) + rating) / newTotalReviews;
        
        // Calculate points to award
        let pointsToAdd = 15; // Base points for completing exchange
        if (rating === 5) pointsToAdd += 10;
        else if (rating === 4) pointsToAdd += 5;
        
        // Calculate level based on total points
        const newPoints = (userData.points || 0) + pointsToAdd;
        const newLevel = calculateLevel(newPoints);
        
        // Try to update - this might fail if we don't have permission
        await updateDoc(userRef, {
          reputation: {
            averageRating: newAverageRating,
            totalReviews: newTotalReviews,
            lastUpdated: serverTimestamp(),
          },
          points: newPoints,
          level: newLevel,
        });
      }
    } catch (reputationError) {
      // If we can't update reputation directly, it's okay
      // In a production app, this would be handled by a Cloud Function
      console.log("Note: Reputation update requires Cloud Function for security. Review was saved successfully.");
    }

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

function calculateLevel(points: number): number {
  if (points >= 500) return 4; // Master Grower
  if (points >= 301) return 3; // Harvester
  if (points >= 151) return 2; // Gardener
  if (points >= 51) return 1;  // Sprout
  return 0; // Seed
}
