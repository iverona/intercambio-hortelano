import { Timestamp } from "firebase/firestore";

export interface Chat {
    id: string;
    listingTitle: string;
    participants: string[];
    lastMessage?: {
        text: string;
        createdAt: Timestamp;
    };
}

export interface Message {
    id: string;
    text: string;
    senderId: string;
    createdAt: Timestamp;
}
