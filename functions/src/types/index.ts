export interface Review {
    rating: number;
    comment: string;
    reviewerId: string;
    reviewedUserId: string;
    createdAt: any;
}

export interface ExchangeData {
    reviews?: Record<string, Review>;
    status?: string;
    [key: string]: any;
}

export interface UserData {
    reputation?: {
        averageRating: number;
        totalReviews: number;
    };
    points?: number;
    level?: string;
    email?: string;
    name?: string;
    notifications?: {
        email?: boolean;
        exchanges?: boolean;
        messages?: boolean;
    };
    avatarUrl?: string | null;
    [key: string]: any;
}
