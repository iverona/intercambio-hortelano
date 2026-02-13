import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import { db } from "./firebase";
import { calculateLevel } from "./utils";
import { ExchangeData, UserData } from "./types";

/**
 * Cloud Function: Update user reputation when a review is submitted
 * Triggers when an exchange document is updated
 */
export const updateUserReputation = onDocumentUpdated(
    "exchanges/{exchangeId}",
    async (event) => {
        if (!event.data) {
            logger.error("No event data available");
            return null;
        }

        const beforeData = event.data.before.data() as ExchangeData;
        const afterData = event.data.after.data() as ExchangeData;

        // Check if reviews field has been modified
        const beforeReviews = beforeData.reviews || {};
        const afterReviews = afterData.reviews || {};

        // Find new reviews by comparing before and after
        const newReviewUserIds: string[] = [];

        for (const userId in afterReviews) {
            if (!beforeReviews[userId] ||
                beforeReviews[userId].rating !== afterReviews[userId].rating ||
                beforeReviews[userId].comment !== afterReviews[userId].comment ||
                beforeReviews[userId].createdAt !== afterReviews[userId].createdAt) {
                // This is a new or updated review
                newReviewUserIds.push(userId);
            }
        }

        if (newReviewUserIds.length === 0) {
            logger.info("No new reviews detected");
            return null;
        }

        logger.info(`Processing ${newReviewUserIds.length} new review(s)`);

        // Process each new review
        const updatePromises = newReviewUserIds.map(async (reviewerId) => {
            const review = afterReviews[reviewerId];
            const reviewedUserId = review.reviewedUserId;

            if (!reviewedUserId) {
                logger.error(`No reviewedUserId found for review by ${reviewerId}`);
                return null;
            }

            try {
                // Get all exchanges where this user has been reviewed
                const exchangesSnapshot = await db.collection("exchanges")
                    .where("status", "==", "completed")
                    .get();

                let totalRating = 0;
                let reviewCount = 0;
                const processedReviews = new Set<string>();

                // Calculate average rating from all reviews
                exchangesSnapshot.forEach((doc) => {
                    const exchangeData = doc.data() as ExchangeData;
                    const reviews = exchangeData.reviews || {};

                    for (const [userId, reviewData] of Object.entries(reviews)) {
                        if (reviewData.reviewedUserId === reviewedUserId) {
                            // Create unique key to avoid counting duplicates
                            const reviewKey = `${doc.id}-${userId}`;
                            if (!processedReviews.has(reviewKey)) {
                                processedReviews.add(reviewKey);
                                totalRating += reviewData.rating;
                                reviewCount++;
                            }
                        }
                    }
                });

                if (reviewCount === 0) {
                    logger.info(`No reviews found for user ${reviewedUserId}`);
                    return null;
                }

                const averageRating = totalRating / reviewCount;

                // Get current user data
                const userRef = db.collection("users").doc(reviewedUserId);
                const userDoc = await userRef.get();

                if (!userDoc.exists) {
                    logger.error(`User ${reviewedUserId} not found`);
                    return null;
                }

                const userData = userDoc.data() as UserData;
                const currentPoints = userData.points || 0;

                // Calculate points for the new review
                let pointsToAdd = 15; // Base points for completing an exchange

                // Add bonus points based on the new review rating
                if (review.rating === 5) {
                    pointsToAdd += 10; // Bonus for 5-star rating
                } else if (review.rating === 4) {
                    pointsToAdd += 5; // Bonus for 4-star rating
                }

                // Only add points if this is truly a new review (not an update)
                const isNewReview = !beforeReviews[reviewerId];
                const newPoints = isNewReview ? currentPoints + pointsToAdd : currentPoints;
                const newLevel = calculateLevel(newPoints);

                // Update user document with new reputation
                const updateData = {
                    reputation: {
                        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
                        totalReviews: reviewCount
                    },
                    points: newPoints,
                    level: newLevel,
                    lastUpdated: new Date().toISOString()
                };

                await userRef.update(updateData);

                logger.info(`Updated reputation for user ${reviewedUserId}:`, {
                    averageRating: updateData.reputation.averageRating,
                    totalReviews: reviewCount,
                    points: newPoints,
                    level: newLevel,
                    pointsAdded: isNewReview ? pointsToAdd : 0
                });

                return updateData;
            } catch (error) {
                logger.error(`Error updating reputation for user ${reviewedUserId}:`, error);
                return null;
            }
        });

        // Wait for all updates to complete
        const results = await Promise.all(updatePromises);

        logger.info("Reputation update completed", {
            processed: results.filter(r => r !== null).length,
            failed: results.filter(r => r === null).length
        });

        return results;
    }
);

/**
 * Cloud Function: Initialize user reputation when account is created
 * This ensures all users have the reputation fields set up
 */
export const initializeUserReputation = onDocumentUpdated(
    "users/{userId}",
    async (event) => {
        if (!event.data) {
            logger.error("No event data available");
            return null;
        }

        const afterData = event.data.after.data() as UserData;

        // Check if reputation fields exist
        if (!afterData.reputation && !afterData.points && !afterData.level) {
            const userRef = event.data.after.ref;

            const initialData = {
                reputation: {
                    averageRating: 0,
                    totalReviews: 0
                },
                points: 0,
                level: "Seed",
                lastUpdated: new Date().toISOString()
            };

            try {
                await userRef.update(initialData);
                logger.info(`Initialized reputation for user ${event.params.userId}`);
            } catch (error) {
                logger.error(`Error initializing reputation for user ${event.params.userId}:`, error);
            }
        }

        return null;
    }
);
