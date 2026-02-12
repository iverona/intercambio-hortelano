/**
 * Cloud Functions for Portal de Intercambio Hortelano
 * Handles server-side operations that require elevated privileges
 */

import { setGlobalOptions } from "firebase-functions";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { getAuth } from "firebase-admin/auth";
import * as logger from "firebase-functions/logger";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onCall, CallableRequest, HttpsError } from "firebase-functions/v2/https";
import * as nodemailer from "nodemailer";

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();

// Set global options for cost control
setGlobalOptions({ maxInstances: 10, region: "europe-southwest1" });

/**
 * Calculate user level based on total points
 */
function calculateLevel(points: number): string {
  if (points >= 500) return "Master Grower";
  if (points >= 301) return "Harvester";
  if (points >= 151) return "Gardener";
  if (points >= 51) return "Sprout";
  return "Seed";
}

interface Review {
  rating: number;
  comment: string;
  reviewerId: string;
  reviewedUserId: string;
  createdAt: any;
}

interface ExchangeData {
  reviews?: Record<string, Review>;
  status?: string;
  [key: string]: any;
}

interface UserData {
  reputation?: {
    averageRating: number;
    totalReviews: number;
  };
  points?: number;
  level?: string;
  [key: string]: any;
}

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

/**
 * Configure Nodemailer Transporter
 */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Helper function to send emails
 */
async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    logger.warn("Email credentials not set. Skipping email send.", {
      to,
      subject,
    });
    return;
  }

  try {
    const mailOptions = {
      from: `"Ecoanuncios" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info("Email sent: " + info.messageId);
    return info;
  } catch (error) {
    logger.error("Error sending email:", error);
    throw error;
  }
}

/**
 * Sanitize a string for safe HTML injection (prevents XSS in email clients)
 */
function escapeHtml(str: string): string {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Cloud Function: Send email notification on new offer (Exchange created)
 */
export const onNewOffer = onDocumentCreated("exchanges/{exchangeId}", async (event) => {
  const exchangeData = event.data?.data();
  const exchangeId = event.params.exchangeId;

  if (!exchangeData) return;

  try {
    // 1. Get Product Owner (Recipient)
    const ownerDoc = await db.collection("users").doc(exchangeData.ownerId).get();
    if (!ownerDoc.exists) {
      logger.warn(`Owner ${exchangeData.ownerId} not found in Firestore`);
      return;
    }
    const ownerData = ownerDoc.data() as UserData;

    let ownerEmail = ownerData.email;
    if (!ownerEmail) {
      try {
        const userRecord = await getAuth().getUser(exchangeData.ownerId);
        ownerEmail = userRecord.email;
      } catch (authError) {
        logger.error(`Error fetching Auth record for owner ${exchangeData.ownerId}:`, authError);
      }
    }

    if (!ownerEmail) {
      logger.error(`Could not determine email for owner ${exchangeData.ownerId}`);
      return;
    }

    // 2. Check Notification Preferences
    const emailEnabled = ownerData.notifications?.email !== false;
    const exchangeNotifEnabled = ownerData.notifications?.exchanges !== false;

    if (!emailEnabled || !exchangeNotifEnabled) {
      return;
    }

    // 3. Get Requester Name
    const requesterDoc = await db
      .collection("users")
      .doc(exchangeData.requesterId)
      .get();
    const requesterName = requesterDoc.exists
      ? requesterDoc.data()?.name
      : "Un usuario";

    // 4. Send Email (all user-provided data is escaped to prevent XSS)
    const safeOwnerName = escapeHtml(ownerData.name || "");
    const safeRequesterName = escapeHtml(requesterName);
    const safeProductName = escapeHtml(exchangeData.productName || "");
    const safeOfferedProductName = escapeHtml(exchangeData.offer?.offeredProductName || "");
    const safeOfferMessage = escapeHtml(exchangeData.offer?.message || "");

    const subject = `Nueva oferta para tu producto: ${safeProductName}`;
    const html = `
      <h2>¡Tienes una nueva oferta!</h2>
      <p>Hola ${safeOwnerName},</p>
      <p><strong>${safeRequesterName}</strong> ha hecho una oferta por tu producto <strong>${safeProductName}</strong>.</p>
      
      <p><strong>Detalles de la oferta:</strong></p>
      <ul>
        <li>Tipo: ${exchangeData.offer?.type === "exchange"
        ? "Intercambio"
        : exchangeData.offer?.type === "chat"
          ? "Solo Chat"
          : "Compra"
      }</li>
        ${safeOfferedProductName
        ? `<li>Producto ofrecido: ${safeOfferedProductName}</li>`
        : ""
      }
        ${safeOfferMessage
        ? `<li>Mensaje: &quot;${safeOfferMessage}&quot;</li>`
        : ""
      }
      </ul>

      <p>Entra en la plataforma para responder:</p>
      <a href="${process.env.BASE_URL || 'https://ecoanuncios.com'}/exchanges/details/${exchangeId}">Ver Intercambio</a>
    `;

    await sendEmail(ownerEmail, subject, html);
  } catch (error) {
    logger.error("Error processing new offer notification:", error);
  }
});

/**
 * Cloud Function: Send email notification on new chat message
 */
export const onNewMessage = onDocumentCreated(
  "chats/{chatId}/messages/{messageId}",
  async (event) => {
    const messageData = event.data?.data();
    const chatId = event.params.chatId;

    if (!messageData) return;

    // Skip notification if this is an initial offer message (already handled by onNewOffer)
    if (messageData.isOfferMessage) {
      logger.info(`Skipping notification for offer message ${event.params.messageId}`);
      return;
    }

    try {
      // 1. Get Chat details to find participants
      const chatDoc = await db.collection("chats").doc(chatId).get();
      if (!chatDoc.exists) {
        logger.warn(`Chat ${chatId} not found`);
        return;
      }
      const chatData = chatDoc.data() as any;

      // 2. Identify Recipient
      const recipientId = chatData.participants.find(
        (uid: string) => uid !== messageData.senderId
      );
      if (!recipientId) {
        logger.warn(`No recipient found for message in chat ${chatId}`);
        return;
      }

      // 3. Get Recipient Data
      const recipientDoc = await db.collection("users").doc(recipientId).get();
      if (!recipientDoc.exists) {
        logger.warn(`Recipient ${recipientId} not found`);
        return;
      }
      const recipientData = recipientDoc.data() as UserData;

      let recipientEmail = recipientData.email;
      if (!recipientEmail) {
        try {
          const userRecord = await getAuth().getUser(recipientId);
          recipientEmail = userRecord.email;
        } catch (authError) {
          logger.error(`Error fetching Auth record for recipient ${recipientId}:`, authError);
        }
      }

      if (!recipientEmail) {
        logger.error(`Could not determine email for recipient ${recipientId}`);
        return;
      }

      // 4. Check Notification Preferences
      const emailEnabled = recipientData.notifications?.email !== false;
      const messageNotifEnabled = recipientData.notifications?.messages !== false;

      if (!emailEnabled || !messageNotifEnabled) {
        return;
      }

      // 5. Get Sender Name
      const senderDoc = await db
        .collection("users")
        .doc(messageData.senderId)
        .get();
      const senderName = senderDoc.exists
        ? senderDoc.data()?.name
        : "Un usuario";

      // 6. Get Exchange ID for the link
      const baseUrl = process.env.BASE_URL || 'https://ecoanuncios.com';
      let exchangeLink = `${baseUrl}/exchanges`;
      const exchangesSnapshot = await db.collection("exchanges")
        .where("chatId", "==", chatId)
        .limit(1)
        .get();

      if (!exchangesSnapshot.empty) {
        const exchangeId = exchangesSnapshot.docs[0].id;
        exchangeLink = `${baseUrl}/exchanges/details/${exchangeId}`;
      }

      // 7. Send Email (all user-provided data is escaped to prevent XSS)
      const safeRecipientName = escapeHtml(recipientData.name || "");
      const safeSenderName = escapeHtml(senderName);
      const safeListingTitle = escapeHtml(chatData.listingTitle || "");
      const safeMessageText = escapeHtml(messageData.text || "");

      const subject = `Nuevo mensaje de ${safeSenderName}`;
      const html = `
      <h2>Nuevo mensaje recibido</h2>
      <p>Hola ${safeRecipientName},</p>
      <p><strong>${safeSenderName}</strong> te ha enviado un mensaje sobre <strong>${safeListingTitle}</strong>:</p>
      
      <blockquote style="background: #f9f9f9; padding: 10px; border-left: 5px solid #ccc;">
        ${safeMessageText}
      </blockquote>

      <a href="${exchangeLink}">Ir al intercambio</a>
    `;

      await sendEmail(recipientEmail, subject, html);
    } catch (error) {
      logger.error("Error processing new message notification:", error);
    }
  }
);

/**
 * Callable Function: Submit Contact Form
 * Security: App Check enforced + input validation + HTML sanitization
 */
export const submitContactForm = onCall(
  { enforceAppCheck: true },
  async (request: CallableRequest) => {
    const { name, email, subject, message } = request.data;
    const uid = request.auth ? request.auth.uid : "Anonymous";

    // --- Input Validation (5.4) ---
    // Type checks
    if (typeof name !== "string" || typeof email !== "string" || typeof message !== "string") {
      throw new HttpsError("invalid-argument", "Invalid field types");
    }
    if (subject !== undefined && typeof subject !== "string") {
      throw new HttpsError("invalid-argument", "Invalid subject type");
    }

    // Required fields
    if (!name.trim() || !email.trim() || !message.trim()) {
      throw new HttpsError("invalid-argument", "Missing required fields");
    }

    // Length limits
    if (name.length > 100) {
      throw new HttpsError("invalid-argument", "Name too long (max 100 characters)");
    }
    if (email.length > 254) {
      throw new HttpsError("invalid-argument", "Email too long");
    }
    if (subject && subject.length > 200) {
      throw new HttpsError("invalid-argument", "Subject too long (max 200 characters)");
    }
    if (message.length > 5000) {
      throw new HttpsError("invalid-argument", "Message too long (max 5000 characters)");
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new HttpsError("invalid-argument", "Invalid email format");
    }

    // --- Sanitize inputs for HTML (5.3) ---
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeSubject = escapeHtml(subject || "Sin asunto");
    const safeMessage = escapeHtml(message);

    try {
      const adminEmail = process.env.EMAIL_USER;
      const emailPromises = [];

      if (adminEmail) {
        const adminSubject = `[Contacto] ${safeSubject} - ${safeName}`;
        const adminHtml = `
        <h3>Nuevo mensaje de contacto</h3>
        <p><strong>De:</strong> ${safeName} (${safeEmail})</p>
        <p><strong>UID:</strong> ${uid}</p>
        <p><strong>Asunto:</strong> ${safeSubject}</p>
        <hr />
        <p>${safeMessage.replace(/\n/g, "<br>")}</p>
      `;

        emailPromises.push(sendEmail(adminEmail, adminSubject, adminHtml));
      } else {
        logger.warn("ADMIN_EMAIL (EMAIL_USER) not set. Admin notification skipped.");
      }

      // Auto-reply to user
      const userHtml = `
      <p>Hola ${safeName},</p>
      <p>Hemos recibido tu mensaje con el asunto: &quot;<strong>${safeSubject}</strong>&quot;.</p>
      <p>Nos pondremos en contacto contigo lo antes posible.</p>
      <br>
      <p>El equipo de Ecoanuncios</p>
    `;

      emailPromises.push(sendEmail(email, "Hemos recibido tu mensaje", userHtml));

      await Promise.all(emailPromises);

      return { success: true };
    } catch (error: any) {
      logger.error("Error in submitContactForm execution:", error);
      // Return a more descriptive error to the client if it's already an HttpsError
      if (error instanceof HttpsError) throw error;
      // Otherwise throw as internal
      throw new HttpsError("internal", error.message || "An unexpected error occurred");
    }
  });

/**
 * Callable Function: Delete User Account
 * Security: App Check enforced + Auth required. userId derived from token (no impersonation).
 * Performs LOPD-compliant account deletion:
 *   1. Archives user data + products (5-year retention)
 *   2. Deletes images from Storage
 *   3. Hard-deletes live Firestore data
 *   4. Rejects pending/accepted exchanges + notifies other party
 *   5. Deletes Firebase Auth account
 */
export const deleteUserAccount = onCall(
  { enforceAppCheck: true },
  async (request: CallableRequest) => {
    // --- Auth Guard ---
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Authentication required");
    }
    const userId = request.auth.uid;
    logger.info(`[DELETE] Starting deletion process for user: ${userId}`);

    try {
      let batch = db.batch();
      let operationCount = 0;
      const BATCH_LIMIT = 450;

      const commitBatch = async () => {
        if (operationCount > 0) {
          await batch.commit();
          batch = db.batch();
          operationCount = 0;
        }
      };

      // --- STEP 1: FETCH DATA ---
      const userRef = db.collection("users").doc(userId);
      const userSnap = await userRef.get();
      if (!userSnap.exists) {
        throw new HttpsError("not-found", "User profile not found");
      }
      const userData = userSnap.data()!;
      logger.info("[DELETE] User data fetched");

      const productsSnapshot = await db.collection("products")
        .where("userId", "==", userId)
        .get();
      const products = productsSnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() })
      );
      logger.info(`[DELETE] Products fetched: ${products.length}`);

      // --- STEP 2: ARCHIVE DATA (LOPD Compliance) ---
      const archiveUserRef = db.collection("archived_users").doc(userId);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { avatarUrl, ...userDataToArchive } = userData;
      batch.set(archiveUserRef, {
        ...userDataToArchive,
        avatarUrl: null,
        archivedAt: FieldValue.serverTimestamp(),
        originalUid: userId,
        deletionReason: "user_request",
      });
      operationCount++;

      for (const product of products) {
        if (operationCount >= BATCH_LIMIT) await commitBatch();
        const archiveProductRef = db
          .collection("archived_users")
          .doc(userId)
          .collection("products")
          .doc(product.id);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { imageUrls, ...productDataToArchive } = product as any;
        batch.set(archiveProductRef, {
          ...productDataToArchive,
          imageUrls: [],
          archivedAt: FieldValue.serverTimestamp(),
        });
        operationCount++;
      }

      logger.info("[DELETE] Committing Archive batch...");
      await commitBatch();
      logger.info("[DELETE] Archive batch committed");

      // --- STEP 3: DELETE IMAGES FROM STORAGE ---
      logger.info("[DELETE] Starting image cleanup...");
      const bucket = getStorage().bucket();

      const deleteStorageFile = async (url: string) => {
        try {
          // Extract the object path from the Firebase Storage URL
          const decodedUrl = decodeURIComponent(url);
          const pathMatch = decodedUrl.match(/\/o\/(.+?)\?/);
          if (pathMatch && pathMatch[1]) {
            await bucket.file(pathMatch[1]).delete();
            logger.info(`[DELETE] Storage file deleted: ${pathMatch[1]}`);
          }
        } catch (error: any) {
          // 404 is fine — file may already be deleted
          if (error?.code !== 404) {
            logger.warn(`Failed to delete storage file: ${url}`, error);
          }
        }
      };

      // Delete Avatar
      if (userData.avatarUrl &&
        typeof userData.avatarUrl === "string" &&
        userData.avatarUrl.includes("firebasestorage")) {
        await deleteStorageFile(userData.avatarUrl);
      }

      // Delete Product Images
      for (const product of products) {
        const p = product as any;
        if (p.imageUrls && Array.isArray(p.imageUrls)) {
          for (const url of p.imageUrls) {
            if (typeof url === "string" && url.includes("firebasestorage")) {
              await deleteStorageFile(url);
            }
          }
        }
      }

      // --- STEP 4: HARD DELETE LIVE DATA ---
      logger.info("[DELETE] Preparing Delete batch...");
      batch.delete(userRef);
      operationCount++;

      for (const docSnap of productsSnapshot.docs) {
        if (operationCount >= BATCH_LIMIT) await commitBatch();
        batch.delete(docSnap.ref);
        operationCount++;
      }

      // --- STEP 5: REJECT PENDING/ACCEPTED EXCHANGES ---
      const [requesterSnapshot, ownerSnapshot] = await Promise.all([
        db.collection("exchanges")
          .where("requesterId", "==", userId)
          .where("status", "in", ["pending", "accepted"])
          .get(),
        db.collection("exchanges")
          .where("ownerId", "==", userId)
          .where("status", "in", ["pending", "accepted"])
          .get(),
      ]);

      const allExchanges = [
        ...requesterSnapshot.docs,
        ...ownerSnapshot.docs,
      ];
      logger.info(`[DELETE] Exchanges to reject: ${allExchanges.length}`);

      for (const exchangeDoc of allExchanges) {
        if (operationCount >= BATCH_LIMIT) await commitBatch();

        const exchangeData = exchangeDoc.data();

        batch.update(exchangeDoc.ref, {
          status: "rejected",
          rejectionReason: "user_deleted",
          updatedAt: FieldValue.serverTimestamp(),
        });
        operationCount++;

        // Notify the other user
        const otherUserId = exchangeData.requesterId === userId
          ? exchangeData.ownerId
          : exchangeData.requesterId;

        if (operationCount >= BATCH_LIMIT) await commitBatch();
        const notifRef = db.collection("notifications").doc();
        batch.set(notifRef, {
          recipientId: otherUserId,
          senderId: userId,
          type: "OFFER_REJECTED",
          entityId: exchangeDoc.id,
          isRead: false,
          createdAt: FieldValue.serverTimestamp(),
          metadata: {
            productName: exchangeData.productName || "Unknown",
            productId: exchangeData.productId || "",
            message: "The other user has deleted their account",
          },
        });
        operationCount++;
      }

      logger.info("[DELETE] Committing Final batch...");
      await commitBatch();
      logger.info("[DELETE] Final batch committed");

      // --- STEP 6: DELETE AUTH ACCOUNT ---
      logger.info("[DELETE] Deleting Auth user...");
      await getAuth().deleteUser(userId);
      logger.info("[DELETE] Auth user deleted. Process complete.");

      return { success: true };
    } catch (error: any) {
      logger.error(`[DELETE] Error deleting account for ${userId}:`, error);
      if (error instanceof HttpsError) throw error;
      throw new HttpsError(
        "internal",
        error.message || "Failed to delete account"
      );
    }
  }
);
