import { Timestamp } from "firebase/firestore";

export type ExchangeStatus = "pending" | "accepted" | "rejected" | "completed";
export type OfferType = "exchange" | "chat";

export interface Message {
    id: string;
    text: string;
    senderId: string;
    createdAt: Timestamp;
}

export interface ExchangeOffer {
    type: OfferType;
    offeredProductId?: string;
    offeredProductName?: string;
    message?: string;
}

export interface Review {
    id: string;
    rating: number;
    comment?: string;
    createdAt: Timestamp;
    reviewerId: string;
    reviewerName: string;
}

export interface ExchangeUser {
    id: string;
    name: string;
    avatarUrl: string;
}

export interface ExchangeProduct {
    id: string;
    name: string;
    description: string;
    imageUrls: string[];
    category: string;
    condition: string;
}


export interface Exchange {
    id: string;
    productId: string;
    productName: string;
    productImage?: string; // Optional, often used in lists
    status: ExchangeStatus;
    requesterId: string;
    ownerId: string;
    chatId?: string;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
    completedAt?: Timestamp;
    offer?: ExchangeOffer;

    // Expanded fields for UI (fetched/populated)
    requester?: ExchangeUser;
    owner?: ExchangeUser;
    partner?: ExchangeUser; // Helper for current user's partner
    product?: ExchangeProduct; // Full details
    lastMessage?: {
        text: string;
        createdAt: Timestamp;
    };
    reviews?: {
        [userId: string]: Review;
    };
}
