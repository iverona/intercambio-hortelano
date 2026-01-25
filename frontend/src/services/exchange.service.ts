import { db } from "@/lib/firebase";
import {
    collection,
    query,
    where,
    onSnapshot,
    doc,
    getDoc,
    updateDoc,
    serverTimestamp,
    addDoc,
    orderBy,
    or,
    Unsubscribe
} from "firebase/firestore";
import { Exchange, Message, ExchangeStatus } from "@/types/exchange";
import { UserData } from "@/types/user";
import { ChatService } from "@/services/chat.service";
import { createNotification } from "@/lib/notifications";

export const ExchangeService = {
    /**
     * Subscribe to user's exchanges (as requester or owner)
     */
    getUserExchanges: (userId: string, callback: (exchanges: Exchange[]) => void): Unsubscribe => {
        const exchangesQuery = query(
            collection(db, "exchanges"),
            or(
                where("requesterId", "==", userId),
                where("ownerId", "==", userId)
            )
        );

        return onSnapshot(exchangesQuery, async (snapshot) => {
            const exchangesData: Exchange[] = [];

            for (const docSnap of snapshot.docs) {
                const data = docSnap.data();
                const exchange: Exchange = {
                    id: docSnap.id,
                    ...data,
                } as Exchange;

                // Populate partner info
                const partnerId = data.requesterId === userId ? data.ownerId : data.requesterId;
                const partnerDoc = await getDoc(doc(db, "users", partnerId));

                if (partnerDoc.exists()) {
                    const partnerData = partnerDoc.data() as UserData;
                    exchange.partner = {
                        id: partnerId,
                        name: partnerData.name || "Unknown User",
                        avatarUrl: partnerData.avatarUrl || "",
                    };
                } else {
                    exchange.partner = {
                        id: partnerId,
                        name: "Unknown User",
                        avatarUrl: "",
                    };
                }

                // Populate last message
                if (data.chatId) {
                    const chatDoc = await getDoc(doc(db, "chats", data.chatId));
                    if (chatDoc.exists()) {
                        const chatData = chatDoc.data();
                        if (chatData.lastMessage) {
                            exchange.lastMessage = chatData.lastMessage;
                        }
                    }
                }

                exchangesData.push(exchange);
            }

            // Sort by recent activity
            exchangesData.sort((a, b) => {
                const timeA = (a.lastMessage?.createdAt || a.updatedAt || a.createdAt)?.toMillis() || 0;
                const timeB = (b.lastMessage?.createdAt || b.updatedAt || b.createdAt)?.toMillis() || 0;
                return timeB - timeA;
            });

            callback(exchangesData);
        });
    },

    /**
     * Get full details for a single exchange
     */
    getExchangeDetails: (exchangeId: string, callback: (exchange: Exchange | null) => void, errorCallback?: (error: any) => void): Unsubscribe => {
        const exchangeRef = doc(db, "exchanges", exchangeId);

        return onSnapshot(exchangeRef, async (exchangeDoc) => {
            if (!exchangeDoc.exists()) {
                callback(null);
                return;
            }

            try {
                const exchangeData = exchangeDoc.data();
                const exchangeInfo: Exchange = {
                    id: exchangeDoc.id,
                    ...exchangeData,
                } as Exchange;

                // Fetch Requester
                const requesterDoc = await getDoc(doc(db, "users", exchangeData.requesterId));
                if (requesterDoc.exists()) {
                    const rData = requesterDoc.data() as UserData;
                    exchangeInfo.requester = {
                        id: exchangeData.requesterId,
                        name: rData.name || "Unknown User",
                        avatarUrl: rData.avatarUrl || ""
                    };
                }

                // Fetch Owner
                const ownerDoc = await getDoc(doc(db, "users", exchangeData.ownerId));
                if (ownerDoc.exists()) {
                    const oData = ownerDoc.data() as UserData;
                    exchangeInfo.owner = {
                        id: exchangeData.ownerId,
                        name: oData.name || "Unknown User",
                        avatarUrl: oData.avatarUrl || ""
                    };
                }

                // Fetch Product
                if (exchangeData.productId) {
                    const productDoc = await getDoc(doc(db, "products", exchangeData.productId));
                    if (productDoc.exists()) {
                        const pData = productDoc.data();
                        exchangeInfo.product = {
                            id: exchangeData.productId,
                            name: pData.name || pData.title || "",
                            description: pData.description,
                            imageUrls: pData.imageUrls || [pData.imageUrl] || [],
                            category: pData.category,
                            condition: pData.condition,
                        };
                    }
                }

                callback(exchangeInfo);
            } catch (error) {
                if (errorCallback) errorCallback(error);
            }
        }, (error) => {
            if (errorCallback) errorCallback(error);
        });
    },

    /**
     * Subscribe to messages for a specific exchange chat
     */
    subscribeToMessages: (chatId: string, callback: (messages: Message[]) => void): Unsubscribe => {
        return ChatService.subscribeToMessages(chatId, callback);
    },

    /**
     * Send a message in a chat
     */
    sendMessage: async (chatId: string, text: string, senderId: string): Promise<void> => {
        return ChatService.sendMessage(chatId, text, senderId);
    },

    /**
     * Update exchange status
     */
    updateStatus: async (exchangeId: string, status: ExchangeStatus): Promise<void> => {
        const exchangeRef = doc(db, "exchanges", exchangeId);
        const updateData: any = {
            status,
            updatedAt: serverTimestamp(),
        };
        if (status === 'completed') {
            updateData.completedAt = serverTimestamp();
        }
        await updateDoc(exchangeRef, updateData);
    },

    /**
     * Create a new exchange offer
     */
    createOffer: async (data: {
        productId: string;
        productName: string;
        requesterId: string;
        ownerId: string;
        offer: {
            type: "exchange" | "chat";
            offeredProductId?: string;
            offeredProductName?: string;
            message?: string;
        };
    }): Promise<string> => {
        try {
            // Create a chat for this exchange immediately
            const chatData = {
                participants: [data.requesterId, data.ownerId],
                listingId: data.productId,
                listingTitle: data.productName,
                createdAt: serverTimestamp(),
                lastMessage: null,
            };

            const chatRef = await addDoc(collection(db, "chats"), chatData);

            // Create an exchange record with the chat already linked
            const exchangesRef = collection(db, "exchanges");
            const exchangeData = {
                productId: data.productId,
                productName: data.productName,
                requesterId: data.requesterId,
                ownerId: data.ownerId,
                status: "pending",
                chatId: chatRef.id,
                offer: data.offer,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            const exchangeDoc = await addDoc(exchangesRef, exchangeData);

            // If there's an initial message, add it to the chat
            if (data.offer.message) {
                const messagesRef = collection(db, "chats", chatRef.id, "messages");
                await addDoc(messagesRef, {
                    text: data.offer.message,
                    senderId: data.requesterId,
                    createdAt: serverTimestamp(),
                });

                // Update the lastMessage field on the chat
                await updateDoc(doc(db, "chats", chatRef.id), {
                    lastMessage: {
                        text: data.offer.message,
                        createdAt: serverTimestamp(),
                    },
                });
            }

            // Send notification to the product owner
            try {
                await createNotification({
                    recipientId: data.ownerId,
                    senderId: data.requesterId,
                    type: "NEW_OFFER",
                    entityId: exchangeDoc.id,
                    metadata: {
                        productName: data.productName,
                        productId: data.productId,
                        offeredProductName: data.offer.offeredProductName,
                        offeredProductId: data.offer.offeredProductId,
                        offerType: data.offer.type,
                        message: data.offer.message ? data.offer.message.substring(0, 100) : undefined,
                        exchangeId: exchangeDoc.id,
                    },
                });
            } catch (notifyError) {
                // Don't fail the whole offer if notification fails
                console.error("Error creating notification for offer:", notifyError);
            }

            return exchangeDoc.id;
        } catch (error) {
            console.error("Error creating offer:", error);
            throw error;
        }
    }
};
