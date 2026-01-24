export interface Product {
    id: string;
    name: string;
    description: string;
    imageUrls: string[];
    category: string;
    userId: string;
    isForExchange?: boolean;
    isForSale?: boolean;
    isFree?: boolean;
    location?: {
        latitude: number;
        longitude: number;
    };
    distance?: number;
    createdAt?: {
        seconds: number;
        nanoseconds: number;
    };
    deleted?: boolean;
}
