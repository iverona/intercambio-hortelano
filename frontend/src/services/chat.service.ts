import { db } from "@/lib/firebase";
import { Chat, Message } from "@/types/chat";
import {
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    updateDoc,
    doc,
    serverTimestamp,
    orderBy
} from "firebase/firestore";

export const ChatService = {
    subscribeToUserChats: (userId: string, callback: (chats: Chat[]) => void) => {
        const chatsQuery = query(
            collection(db, "chats"),
            where("participants", "array-contains", userId)
        );

        return onSnapshot(chatsQuery, (snapshot) => {
            const chatsData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Chat[];

            // Sort by last message timestamp
            chatsData.sort((a, b) => {
                const timeA = a.lastMessage?.createdAt?.toMillis() || 0;
                const timeB = b.lastMessage?.createdAt?.toMillis() || 0;
                return timeB - timeA;
            });

            callback(chatsData);
        });
    },

    subscribeToMessages: (chatId: string, callback: (messages: Message[]) => void) => {
        const messagesRef = collection(db, "chats", chatId, "messages");
        const q = query(messagesRef, orderBy("createdAt", "asc"));

        return onSnapshot(q, (snapshot) => {
            const messages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Message[];
            callback(messages);
        });
    },

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
    }
};
