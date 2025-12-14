export interface Product {
    id: string;
    name: string;
    description: string;
    imageUrls: string[];
    category: string;
    isForExchange?: boolean;
    isForSale?: boolean;
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
