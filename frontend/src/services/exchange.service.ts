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
                            title: pData.title,
                            description: pData.description,
                            images: pData.images || [],
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
        const messagesRef = collection(db, "chats", chatId, "messages");
        const q = query(messagesRef, orderBy("createdAt", "asc"));

        return onSnapshot(q, (querySnapshot) => {
            const msgs = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Message[];
            callback(msgs);
        });
    },

    /**
     * Send a message in a chat
     */
    sendMessage: async (chatId: string, text: string, senderId: string): Promise<void> => {
        const messagesRef = collection(db, "chats", chatId, "messages");
        const chatRef = doc(db, "chats", chatId);

        await addDoc(messagesRef, {
            text,
            senderId,
            createdAt: serverTimestamp(),
        });

        await updateDoc(chatRef, {
            lastMessage: {
                text,
                createdAt: serverTimestamp(),
            },
        });
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
    }
};
