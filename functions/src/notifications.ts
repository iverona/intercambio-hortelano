import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import { db } from "./firebase";
import { emailUser, emailPass, BASE_URL } from "./config";
import { sendEmail, escapeHtml, getUserEmail, getUserDisplayName } from "./utils";
import { UserData } from "./types";

/**
 * Cloud Function: Send email notification on new offer (Exchange created)
 */
export const onNewOffer = onDocumentCreated({
    document: "exchanges/{exchangeId}",
    secrets: [emailUser, emailPass],
}, async (event) => {
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

        const ownerEmail = await getUserEmail(exchangeData.ownerId, ownerData);

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
        const requesterName = await getUserDisplayName(exchangeData.requesterId);

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
      <a href="${BASE_URL}/exchanges/details/${exchangeId}">Ver Intercambio</a>
    `;

        await sendEmail(ownerEmail, subject, html);
    } catch (error) {
        logger.error("Error processing new offer notification:", error);
    }
});

/**
 * Cloud Function: Send email notification on new chat message
 */
export const onNewMessage = onDocumentCreated({
    document: "chats/{chatId}/messages/{messageId}",
    secrets: [emailUser, emailPass],
},
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

            const recipientEmail = await getUserEmail(recipientId, recipientData);

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
            const senderName = await getUserDisplayName(messageData.senderId);

            // 6. Get Exchange ID for the link
            let exchangeLink = `${BASE_URL}/exchanges`;
            const exchangesSnapshot = await db.collection("exchanges")
                .where("chatId", "==", chatId)
                .limit(1)
                .get();

            if (!exchangesSnapshot.empty) {
                const exchangeId = exchangesSnapshot.docs[0].id;
                exchangeLink = `${BASE_URL}/exchanges/details/${exchangeId}`;
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
