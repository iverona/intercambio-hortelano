/**
 * Cloud Functions for Portal de Intercambio Hortelano
 * Handles server-side operations that require elevated privileges
 */

import { setGlobalOptions } from "firebase-functions";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import * as logger from "firebase-functions/logger";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onCall, CallableRequest } from "firebase-functions/v2/https";
import * as nodemailer from "nodemailer";

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();

// Set global options for cost control
setGlobalOptions({ maxInstances: 10 });

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
      from: `"Portal Hortelano" <${process.env.EMAIL_USER}>`,
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
 * Cloud Function: Send email notification on new offer (Exchange created)
 */
export const onNewOffer = onDocumentCreated("exchanges/{exchangeId}", async (event) => {
  const exchangeData = event.data?.data();
  const exchangeId = event.params.exchangeId;

  if (!exchangeData) return;

  try {
    logger.info(`Processing new offer ${exchangeId}. OwnerId: ${exchangeData.ownerId}`);

    // 1. Get Product Owner (Recipient)
    const ownerDoc = await db.collection("users").doc(exchangeData.ownerId).get();
    if (!ownerDoc.exists) {
      logger.warn(`Owner ${exchangeData.ownerId} not found in Firestore`);
      return;
    }
    const ownerData = ownerDoc.data() as UserData;

    let ownerEmail = ownerData.email;
    if (!ownerEmail) {
      logger.info(`Email missing in Firestore for owner ${exchangeData.ownerId}. Fetching from Auth...`);
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
      logger.info(
        `Email notifications disabled for user ${exchangeData.ownerId}`
      );
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

    // 4. Send Email
    const subject = `Nueva oferta para tu producto: ${exchangeData.productName}`;
    const html = `
      <h2>¡Tienes una nueva oferta!</h2>
      <p>Hola ${ownerData.name},</p>
      <p><strong>${requesterName}</strong> ha hecho una oferta por tu producto <strong>${exchangeData.productName
      }</strong>.</p>
      
      <p><strong>Detalles de la oferta:</strong></p>
      <ul>
        <li>Tipo: ${exchangeData.offer?.type === "exchange"
        ? "Intercambio"
        : exchangeData.offer?.type === "chat"
          ? "Solo Chat"
          : "Compra"
      }</li>
        ${exchangeData.offer?.offeredProductName
        ? `<li>Producto ofrecido: ${exchangeData.offer.offeredProductName}</li>`
        : ""
      }
        ${exchangeData.offer?.message
        ? `<li>Mensaje: "${exchangeData.offer.message}"</li>`
        : ""
      }
      </ul>

      <p>Entra en la plataforma para responder:</p>
      <a href="https://portal-intercambio-hortelano.web.app/exchanges/details/${exchangeId}">Ver Intercambio</a>
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

    try {
      const messageId = event.params.messageId;
      logger.info(`Processing new message in chat ${chatId}. MessageId: ${messageId}`);

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
        logger.info(`Email missing in Firestore for recipient ${recipientId}. Fetching from Auth...`);
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

      // 6. Send Email
      const subject = `Nuevo mensaje de ${senderName}`;
      const html = `
      <h2>Nuevo mensaje recibido</h2>
      <p>Hola ${recipientData.name},</p>
      <p><strong>${senderName}</strong> te ha enviado un mensaje sobre <strong>${chatData.listingTitle}</strong>:</p>
      
      <blockquote style="background: #f9f9f9; padding: 10px; border-left: 5px solid #ccc;">
        ${messageData.text}
      </blockquote>

      <a href="https://portal-intercambio-hortelano.web.app/exchanges">Ir a mis mensajes</a>
    `;

      await sendEmail(recipientEmail, subject, html);
    } catch (error) {
      logger.error("Error processing new message notification:", error);
    }
  }
);

/**
 * Callable Function: Submit Contact Form
 */
export const submitContactForm = onCall(async (request: CallableRequest) => {
  const { name, email, subject, message } = request.data;
  const uid = request.auth ? request.auth.uid : "Anonymous";

  // Validate input
  if (!name || !email || !message) {
    throw new Error("Missing required fields");
  }

  const adminEmail = process.env.EMAIL_USER;

  if (adminEmail) {
    const adminSubject = `[Contacto] ${subject || 'Sin asunto'} - ${name}`;
    const adminHtml = `
        <h3>Nuevo mensaje de contacto</h3>
        <p><strong>De:</strong> ${name} (${email})</p>
        <p><strong>UID:</strong> ${uid}</p>
        <p><strong>Asunto:</strong> ${subject}</p>
        <hr />
        <p>${message.replace(/\n/g, '<br>')}</p>
      `;

    await sendEmail(adminEmail, adminSubject, adminHtml);
  }

  // Auto-reply
  const userHtml = `
      <p>Hola ${name},</p>
      <p>Hemos recibido tu mensaje con el asunto: "<strong>${subject}</strong>".</p>
      <p>Nos pondremos en contacto contigo lo antes posible.</p>
      <br>
      <p>El equipo de Portal de Intercambio Hortelano</p>
  `;

  await sendEmail(email, "Hemos recibido tu mensaje", userHtml);

  return { success: true };
});
