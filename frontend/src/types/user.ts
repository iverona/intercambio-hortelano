export interface UserData {
    uid?: string; // Sometimes used for producer identification
    name: string;
    email: string;
    avatarUrl: string;
    bio?: string;
    location?: {
        latitude: number;
        longitude: number;
    };
    geohash?: string;
    address?: string;
    locationUpdatedAt?: {
        seconds: number;
        nanoseconds: number;
    };
    joinedDate?: {
        seconds: number;
        nanoseconds: number;
    };
    notifications?: {
        email?: boolean;
        messages?: boolean;
        exchanges?: boolean;
        products?: boolean;
    };
    privacy?: {
        showLocation?: boolean;
        publicProfile?: boolean;
    };
    reputation?: {
        averageRating: number;
        totalReviews: number;
    };
    points?: number;
    level?: number;
    badges?: string[];
    preferredLocale?: string;
}

export interface Producer extends UserData {
    productsCount?: number;
    distance?: number;
    deleted?: boolean;
}
