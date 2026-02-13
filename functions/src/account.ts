import { onCall, CallableRequest, HttpsError } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import { db, auth, storage } from "./firebase";

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
            const bucket = storage.bucket();

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
            await auth.deleteUser(userId);
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
