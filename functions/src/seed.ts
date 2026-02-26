
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { geohashForLocation } from "geofire-common";

// Initialize admin with default credentials
// If running locally with the emulator, set FIREBASE_FIRESTORE_EMULATOR_HOST=localhost:8080
initializeApp();

const db = getFirestore();

const CITIES = [
    { name: "Madrid", lat: 40.4168, lng: -3.7038 },
    { name: "Barcelona", lat: 41.3851, lng: 2.1734 },
    { name: "Sevilla", lat: 37.3891, lng: -5.9845 },
    { name: "Valencia", lat: 39.4699, lng: -0.3763 },
    { name: "Bilbao", lat: 43.2630, lng: -2.9350 },
    { name: "Zaragoza", lat: 41.6488, lng: -0.8891 },
    { name: "Málaga", lat: 36.7213, lng: -4.4214 },
    { name: "Murcia", lat: 37.9922, lng: -1.1307 },
    { name: "Palma", lat: 39.5696, lng: 2.6502 },
    { name: "Las Palmas", lat: 28.1235, lng: -15.4363 },
];


const PRODUCT_TEMPLATES = [
    { name: "Tomates de huerta", category: "vegetables", desc: "Tomates maduros recién cogidos, muy sabrosos." },
    { name: "Lechuga romana", category: "vegetables", desc: "Lechuga fresca ideal para ensaladas." },
    { name: "Zanahorias ecológicas", category: "vegetables", desc: "Zanahorias cultivadas sin pesticidas." },
    { name: "Cebollas moradas", category: "vegetables", desc: "Cebollas dulces perfectas para sofritos." },
    { name: "Pimientos de Padrón", category: "vegetables", desc: "Algunos pican y otros no. Muy frescos." },
    { name: "Manzanas Golden", category: "fruits", desc: "Manzanas dulces y crujientes de mi jardín." },
    { name: "Peras de agua", category: "fruits", desc: "Peras muy jugosas y dulces." },
    { name: "Naranjas de mesa", category: "fruits", desc: "Naranjas recién cogidas del árbol." },
    { name: "Limones", category: "fruits", desc: "Limones con mucha piel y zumo." },
    { name: "Higos frescos", category: "fruits", desc: "Higos de temporada, muy dulces." },
    { name: "Romero fresco", category: "herbs", desc: "Ramas de romero muy aromáticas." },
    { name: "Tomillo silvestre", category: "herbs", desc: "Tomillo recogido del campo, ideal para guisos." },
    { name: "Menta para infusiones", category: "herbs", desc: "Hojas de menta fresca y fragante." },
    { name: "Semillas de Calabaza", category: "seeds", desc: "Semillas para plantar en la próxima temporada." },
    { name: "Semillas de Girasol", category: "seeds", desc: "Semillas de girasoles gigantes." },
];

const USER_NAMES = [
    "Juan García", "María López", "Antonio Pérez", "Carmen González", "Jose Rodríguez",
    "Ana Martínez", "Paco Sánchez", "Isabel Romero", "Manuel Navarro", "Elena Torres",
    "Luis Ruiz", "Marta Díaz", "Andrés Serrrano", "Lucía Castro", "Diego Morales",
    "Paula Ortega", "Ricardo Alonso", "Sonia Marín", "Gabriel Rubio", "Beatriz Sanz"
];

const AVATARS = [
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Juan",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Antonio",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Carmen",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Jose",
];

const PRODUCT_IMAGES = [
    "https://images.unsplash.com/photo-1597362868479-35442175aee5?q=80&w=500&auto=format&fit=crop", // Tomato
    "https://images.unsplash.com/photo-1622206141842-166291a13e2f?q=80&w=500&auto=format&fit=crop", // Lettuce
    "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?q=80&w=500&auto=format&fit=crop", // Carrot
    "https://images.unsplash.com/photo-1508747703725-7197776145ee?q=80&w=500&auto=format&fit=crop", // Fruits
    "https://images.unsplash.com/photo-1592419044706-39796d40f98e?q=80&w=500&auto=format&fit=crop", // Herbs
];

async function seed() {
    console.log("Starting seed process...");

    for (let i = 0; i < USER_NAMES.length; i++) {
        const name = USER_NAMES[i];
        const city = CITIES[Math.floor(Math.random() * CITIES.length)];
        // Add random jitter to city location
        const lat = city.lat + (Math.random() - 0.5) * 0.1;
        const lng = city.lng + (Math.random() - 0.5) * 0.1;
        const geohash = geohashForLocation([lat, lng], 7);

        const userId = `test-user-${i}`;
        const userRef = db.collection("users").doc(userId);

        const productCount = Math.floor(Math.random() * 6) + 5; // 5 to 10 products per user

        const userData = {
            uid: userId,
            name,
            email: `test${i}@hortelano.com`,
            avatarUrl: AVATARS[i % AVATARS.length],
            location: { latitude: lat, longitude: lng },
            geohash,
            address: `${city.name}, España`,
            onboardingComplete: true,
            productsCount: productCount,
            joinedDate: FieldValue.serverTimestamp(),
            bio: "Entusiasta de la huerta urbana y el intercambio de productos frescos.",
            authMethod: "password",
            role: "user",
            deleted: false,
            reputation: { averageRating: 4.5, totalReviews: Math.floor(Math.random() * 10) }
        };

        await userRef.set(userData);
        console.log(`Created user: ${name} with ${productCount} products`);

        for (let j = 0; j < productCount; j++) {
            const template = PRODUCT_TEMPLATES[Math.floor(Math.random() * PRODUCT_TEMPLATES.length)];

            const productRef = db.collection("products").doc();
            await productRef.set({
                name: template.name,
                description: template.desc,
                category: template.category,
                userId: userId,
                imageUrls: [PRODUCT_IMAGES[Math.floor(Math.random() * PRODUCT_IMAGES.length)]],
                isForExchange: true,
                isFree: Math.random() > 0.8,
                createdAt: FieldValue.serverTimestamp(),
            });
        }
    }

    console.log("Seed process completed successfully!");
}

seed().catch(console.error);
