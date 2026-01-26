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
exports.submitContactForm = exports.onNewMessage = exports.onNewOffer = exports.initializeUserReputation = exports.updateUserReputation = void 0;
const firebase_functions_1 = require("firebase-functions");
const firestore_1 = require("firebase-functions/v2/firestore");
const app_1 = require("firebase-admin/app");
const firestore_2 = require("firebase-admin/firestore");
const auth_1 = require("firebase-admin/auth");
const logger = __importStar(require("firebase-functions/logger"));
const firestore_3 = require("firebase-functions/v2/firestore");
const https_1 = require("firebase-functions/v2/https");
const nodemailer = __importStar(require("nodemailer"));
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
async function sendEmail(to, subject, html) {
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
    }
    catch (error) {
        logger.error("Error sending email:", error);
        throw error;
    }
}
/**
 * Cloud Function: Send email notification on new offer (Exchange created)
 */
exports.onNewOffer = (0, firestore_3.onDocumentCreated)("exchanges/{exchangeId}", async (event) => {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const exchangeData = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    const exchangeId = event.params.exchangeId;
    if (!exchangeData)
        return;
    try {
        logger.info(`Processing new offer ${exchangeId}. OwnerId: ${exchangeData.ownerId}`);
        // 1. Get Product Owner (Recipient)
        const ownerDoc = await db.collection("users").doc(exchangeData.ownerId).get();
        if (!ownerDoc.exists) {
            logger.warn(`Owner ${exchangeData.ownerId} not found in Firestore`);
            return;
        }
        const ownerData = ownerDoc.data();
        let ownerEmail = ownerData.email;
        if (!ownerEmail) {
            logger.info(`Email missing in Firestore for owner ${exchangeData.ownerId}. Fetching from Auth...`);
            try {
                const userRecord = await (0, auth_1.getAuth)().getUser(exchangeData.ownerId);
                ownerEmail = userRecord.email;
            }
            catch (authError) {
                logger.error(`Error fetching Auth record for owner ${exchangeData.ownerId}:`, authError);
            }
        }
        if (!ownerEmail) {
            logger.error(`Could not determine email for owner ${exchangeData.ownerId}`);
            return;
        }
        // 2. Check Notification Preferences
        const emailEnabled = ((_b = ownerData.notifications) === null || _b === void 0 ? void 0 : _b.email) !== false;
        const exchangeNotifEnabled = ((_c = ownerData.notifications) === null || _c === void 0 ? void 0 : _c.exchanges) !== false;
        if (!emailEnabled || !exchangeNotifEnabled) {
            logger.info(`Email notifications disabled for user ${exchangeData.ownerId}`);
            return;
        }
        // 3. Get Requester Name
        const requesterDoc = await db
            .collection("users")
            .doc(exchangeData.requesterId)
            .get();
        const requesterName = requesterDoc.exists
            ? (_d = requesterDoc.data()) === null || _d === void 0 ? void 0 : _d.name
            : "Un usuario";
        // 4. Send Email
        const subject = `Nueva oferta para tu producto: ${exchangeData.productName}`;
        const html = `
      <h2>¡Tienes una nueva oferta!</h2>
      <p>Hola ${ownerData.name},</p>
      <p><strong>${requesterName}</strong> ha hecho una oferta por tu producto <strong>${exchangeData.productName}</strong>.</p>
      
      <p><strong>Detalles de la oferta:</strong></p>
      <ul>
        <li>Tipo: ${((_e = exchangeData.offer) === null || _e === void 0 ? void 0 : _e.type) === "exchange"
            ? "Intercambio"
            : ((_f = exchangeData.offer) === null || _f === void 0 ? void 0 : _f.type) === "chat"
                ? "Solo Chat"
                : "Compra"}</li>
        ${((_g = exchangeData.offer) === null || _g === void 0 ? void 0 : _g.offeredProductName)
            ? `<li>Producto ofrecido: ${exchangeData.offer.offeredProductName}</li>`
            : ""}
        ${((_h = exchangeData.offer) === null || _h === void 0 ? void 0 : _h.message)
            ? `<li>Mensaje: "${exchangeData.offer.message}"</li>`
            : ""}
      </ul>

      <p>Entra en la plataforma para responder:</p>
      <a href="https://portal-intercambio-hortelano.web.app/exchanges/details/${exchangeId}">Ver Intercambio</a>
    `;
        await sendEmail(ownerEmail, subject, html);
    }
    catch (error) {
        logger.error("Error processing new offer notification:", error);
    }
});
/**
 * Cloud Function: Send email notification on new chat message
 */
exports.onNewMessage = (0, firestore_3.onDocumentCreated)("chats/{chatId}/messages/{messageId}", async (event) => {
    var _a, _b, _c, _d;
    const messageData = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    const chatId = event.params.chatId;
    if (!messageData)
        return;
    try {
        const messageId = event.params.messageId;
        logger.info(`Processing new message in chat ${chatId}. MessageId: ${messageId}`);
        // 1. Get Chat details to find participants
        const chatDoc = await db.collection("chats").doc(chatId).get();
        if (!chatDoc.exists) {
            logger.warn(`Chat ${chatId} not found`);
            return;
        }
        const chatData = chatDoc.data();
        // 2. Identify Recipient
        const recipientId = chatData.participants.find((uid) => uid !== messageData.senderId);
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
        const recipientData = recipientDoc.data();
        let recipientEmail = recipientData.email;
        if (!recipientEmail) {
            logger.info(`Email missing in Firestore for recipient ${recipientId}. Fetching from Auth...`);
            try {
                const userRecord = await (0, auth_1.getAuth)().getUser(recipientId);
                recipientEmail = userRecord.email;
            }
            catch (authError) {
                logger.error(`Error fetching Auth record for recipient ${recipientId}:`, authError);
            }
        }
        if (!recipientEmail) {
            logger.error(`Could not determine email for recipient ${recipientId}`);
            return;
        }
        // 4. Check Notification Preferences
        const emailEnabled = ((_b = recipientData.notifications) === null || _b === void 0 ? void 0 : _b.email) !== false;
        const messageNotifEnabled = ((_c = recipientData.notifications) === null || _c === void 0 ? void 0 : _c.messages) !== false;
        if (!emailEnabled || !messageNotifEnabled) {
            return;
        }
        // 5. Get Sender Name
        const senderDoc = await db
            .collection("users")
            .doc(messageData.senderId)
            .get();
        const senderName = senderDoc.exists
            ? (_d = senderDoc.data()) === null || _d === void 0 ? void 0 : _d.name
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
    }
    catch (error) {
        logger.error("Error processing new message notification:", error);
    }
});
/**
 * Callable Function: Submit Contact Form
 */
exports.submitContactForm = (0, https_1.onCall)(async (request) => {
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
//# sourceMappingURL=index.js.map