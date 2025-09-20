"use strict";
/**
 * Cloud Functions for Portal de Intercambio Hortelano
 * Handles server-side operations that require elevated privileges
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeUserReputation = exports.updateUserReputation = void 0;
const firebase_functions_1 = require("firebase-functions");
const firestore_1 = require("firebase-functions/v2/firestore");
const app_1 = require("firebase-admin/app");
const firestore_2 = require("firebase-admin/firestore");
const logger = __importStar(require("firebase-functions/logger"));
// Initialize Firebase Admin
(0, app_1.initializeApp)();
const db = (0, firestore_2.getFirestore)();
// Set global options for cost control
(0, firebase_functions_1.setGlobalOptions)({ maxInstances: 10 });
/**
 * Calculate user level based on total points
 */
function calculateLevel(points) {
    if (points >= 500)
        return "Master Grower";
    if (points >= 301)
        return "Harvester";
    if (points >= 151)
        return "Gardener";
    if (points >= 51)
        return "Sprout";
    return "Seed";
}
/**
 * Cloud Function: Update user reputation when a review is submitted
 * Triggers when an exchange document is updated
 */
exports.updateUserReputation = (0, firestore_1.onDocumentUpdated)("exchanges/{exchangeId}", async (event) => {
    if (!event.data) {
        logger.error("No event data available");
        return null;
    }
    const beforeData = event.data.before.data();
    const afterData = event.data.after.data();
    // Check if reviews field has been modified
    const beforeReviews = beforeData.reviews || {};
    const afterReviews = afterData.reviews || {};
    // Find new reviews by comparing before and after
    const newReviewUserIds = [];
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
            const processedReviews = new Set();
            // Calculate average rating from all reviews
            exchangesSnapshot.forEach((doc) => {
                const exchangeData = doc.data();
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
            const userData = userDoc.data();
            const currentPoints = userData.points || 0;
            // Calculate points for the new review
            let pointsToAdd = 15; // Base points for completing an exchange
            // Add bonus points based on the new review rating
            if (review.rating === 5) {
                pointsToAdd += 10; // Bonus for 5-star rating
            }
            else if (review.rating === 4) {
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
        }
        catch (error) {
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
});
/**
 * Cloud Function: Initialize user reputation when account is created
 * This ensures all users have the reputation fields set up
 */
exports.initializeUserReputation = (0, firestore_1.onDocumentUpdated)("users/{userId}", async (event) => {
    if (!event.data) {
        logger.error("No event data available");
        return null;
    }
    const afterData = event.data.after.data();
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
        }
        catch (error) {
            logger.error(`Error initializing reputation for user ${event.params.userId}:`, error);
        }
    }
    return null;
});
//# sourceMappingURL=index.js.map