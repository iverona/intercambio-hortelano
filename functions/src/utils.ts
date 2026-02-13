import * as nodemailer from "nodemailer";
import * as logger from "firebase-functions/logger";
import { emailUser, emailPass } from "./config";
import { auth, db } from "./firebase";
import { UserData } from "./types";

/**
 * Configure Nodemailer Transporter
 */
export async function sendEmail(to: string, subject: string, html: string, replyTo?: string) {
    if (!emailUser.value() || !emailPass.value()) {
        logger.warn("Email credentials not set. Skipping email send.", {
            to,
            subject,
        });
        return;
    }

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: emailUser.value(),
            pass: emailPass.value(),
        },
    });

    try {
        const mailOptions = {
            from: `"Ecoanuncios" <${emailUser.value()}>`,
            to,
            subject,
            html,
            replyTo,
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
export function escapeHtml(str: string): string {
    if (typeof str !== "string") return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Helper to get user email from Firestore data or Auth backup
 */
export async function getUserEmail(userId: string, userData: UserData): Promise<string | undefined> {
    if (userData.email) return userData.email;

    try {
        const userRecord = await auth.getUser(userId);
        return userRecord.email;
    } catch (authError) {
        logger.error(`Error fetching Auth record for user ${userId}:`, authError);
        return undefined;
    }
}

/**
 * Helper to get user display name
 */
export async function getUserDisplayName(userId: string): Promise<string> {
    try {
        const userDoc = await db.collection("users").doc(userId).get();
        return userDoc.exists ? userDoc.data()?.name || "Un usuario" : "Un usuario";
    } catch (error) {
        logger.error(`Error fetching user name for ${userId}:`, error);
        return "Un usuario";
    }
}

/**
 * Calculate user level based on total points
 */
export function calculateLevel(points: number): string {
    if (points >= 500) return "Master Grower";
    if (points >= 301) return "Harvester";
    if (points >= 151) return "Gardener";
    if (points >= 51) return "Sprout";
    return "Seed";
}
