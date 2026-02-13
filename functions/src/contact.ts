import { onCall, CallableRequest, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { emailUser, emailPass } from "./config";
import { sendEmail, escapeHtml } from "./utils";

/**
 * Callable Function: Submit Contact Form
 * Security: App Check enforced + input validation + HTML sanitization
 */
export const submitContactForm = onCall(
    { enforceAppCheck: true, secrets: [emailUser, emailPass] },
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
            const adminEmail = emailUser.value();
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

                // Pass user email as replyTo
                emailPromises.push(sendEmail(adminEmail, adminSubject, adminHtml, email));
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
