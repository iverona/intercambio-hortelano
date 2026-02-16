import { onDocumentDeleted } from "firebase-functions/v2/firestore";
import { FieldValue } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import { db } from "./firebase";

/**
 * Trigger: On Product Deleted
 * Captures deleted products and archives them for LOPD/History purposes.
 * This runs with Admin SDK privileges, bypassing client-side security rules.
 */
export const onProductDeleted = onDocumentDeleted(
    "products/{productId}",
    async (event) => {
        const snap = event.data;
        const productId = event.params.productId;

        if (!snap) {
            logger.warn(`[ARCHIVE] No data associated with event for product: ${productId}`);
            return;
        }

        const productData = snap.data();
        const userId = productData.userId;

        if (!userId) {
            logger.warn(`[ARCHIVE] Product ${productId} has no userId, skipping archive.`);
            return;
        }

        logger.info(`[ARCHIVE] Archiving deleted product ${productId} for user ${userId}`);

        try {
            const archiveRef = db
                .collection("archived_users")
                .doc(userId)
                .collection("products")
                .doc(productId);

            // Remove purely visual/storage dependent fields if needed, 
            // but for now we keep data mostly intact for history.
            // We set imageUrls to empty as the actual files are likely deleted by the client 
            // (or should be deleted by another trigger).
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { imageUrls, ...dataToArchive } = productData;

            await archiveRef.set({
                ...dataToArchive,
                imageUrls: [], // Files are deleted, so we clear the links
                originalProductId: productId,
                archivedAt: FieldValue.serverTimestamp(),
                deletionReason: "product_deleted_trigger"
            });

            logger.info(`[ARCHIVE] Successfully archived product ${productId}`);
        } catch (error) {
            logger.error(`[ARCHIVE] Failed to archive product ${productId}`, error);
        }
    }
);
