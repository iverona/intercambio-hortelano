# Portal de Intercambio Hortelano - Technical Documentation

## 1. Technology Stack

This project is built with a modern, scalable, and efficient technology stack, leveraging the strengths of the JavaScript ecosystem for both frontend and backend development.

| Category           | Technology / Library | Description                                                                                                                              |
| ------------------ | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend Framework** | `Next.js` (v15)      | The core framework for the application, enabling Server-Side Rendering (SSR), Static Site Generation (SSG), and a rich developer experience with its App Router. |
| **UI Library**     | `React` (v19)        | The fundamental library for building the user interface with a component-based architecture.                                           |
| **Language**       | `TypeScript`         | Provides static typing for JavaScript, improving code quality, readability, and developer productivity by catching errors early.       |
| **Styling**        | `Tailwind CSS` (v4)  | A utility-first CSS framework for rapidly building custom designs without writing traditional CSS.                                     |
| **UI Components**  | `shadcn/ui`          | A collection of beautifully designed, accessible, and unstyled components built on top of Radix UI primitives that can be easily customized. |
| **Icons**          | `Lucide React`       | A comprehensive and consistent icon library used throughout the application for clear visual communication.                               |
| **Backend & DB**   | `Firebase`           | A Backend-as-a-Service (BaaS) platform providing a suite of tools for building web and mobile apps.                                      |
| ├─ **Authentication** | `Firebase Auth`      | Handles user registration, login (including Google provider), and session management securely.                                         |
| ├─ **Database**      | `Firestore`          | A flexible, scalable NoSQL database for storing all application data, with real-time data synchronization capabilities.                |
| **State Management** | `React Context API`  | Used for managing global state across the application, such as user authentication (`AuthContext`) and product filters (`FilterContext`). |
| **Date Utility**   | `date-fns`           | A modern and lightweight library for manipulating dates and times.                                                                       |
| **Notifications**  | `Sonner`             | Provides a simple and elegant way to display toast notifications to the user for actions like success or error messages.                 |

## 2. Codebase Structure

The frontend codebase is organized following the conventions of the Next.js App Router. This structure is designed to be intuitive, scalable, and easy to navigate.

```
frontend/
├── src/
│   ├── app/
│   │   ├── (auth)/             # Route group for authentication pages (login, signup)
│   │   ├── product/[id]/       # Dynamic route for viewing a single product
│   │   ├── publish/            # Route for creating a new product listing
│   │   ├── profile/            # User profile page
│   │   ├── layout.tsx          # Root layout for the entire application
│   │   └── page.tsx            # The main landing page (product feed)
│   │
│   ├── components/
│   │   ├── shared/             # Reusable components used across multiple pages (e.g., ProductCard)
│   │   └── ui/                 # Core UI components from shadcn/ui (Button, Card, etc.)
│   │
│   ├── context/
│   │   ├── AuthContext.tsx     # Manages user authentication state globally
│   │   ├── FilterContext.tsx   # Manages the state of product filters
│   │   └── NotificationContext.tsx # Manages notifications
│   │
│   ├── hooks/
│   │   └── useGoogleAuth.ts    # Custom hook for handling Google authentication logic
│   │
│   └── lib/
│       ├── firebase.ts         # Firebase initialization and configuration
│       ├── geolocation.ts      # Utility functions for distance calculations
│       └── utils.ts            # General utility functions (e.g., for Tailwind CSS class merging)
│
├── public/
│   └── ...                     # Static assets like images and icons
│
└── ...                         # Configuration files (next.config.ts, tailwind.config.ts, etc.)
```

### Key Directories

-   **`src/app`**: This is the heart of the application, where all routes and pages are defined. The folder structure directly maps to the URL paths.
    -   **Route Groups (`(folder)`):** Folders wrapped in parentheses, like `(auth)`, are used to organize routes without affecting the URL.
    -   **Dynamic Routes (`[folder]`):** Folders with square brackets, like `[id]`, are used to create dynamic pages that can handle variable URL parameters (e.g., different product IDs).
-   **`src/components`**: Contains all reusable React components.
    -   **`shared/`**: Components that have business logic and are used in multiple places.
    -   **`ui/`**: Basic, unstyled UI primitives, mostly from `shadcn/ui`.
-   **`src/context`**: Holds React Context providers, which are used to manage global state that needs to be accessible by many components throughout the app.
-   **`src/hooks`**: For custom React hooks that encapsulate and reuse stateful logic.
-   **`src/lib`**: A collection of utility modules and helper functions, including Firebase setup, and other core logic.
-   **`public`**: Stores all static assets that are served directly, such as images, fonts, and icons.

## 3. Data Models

The application's data is stored in **Firestore**, a NoSQL document database. The data is organized into collections of documents, where each document contains a set of key-value pairs. Below are the primary collections used in the application.

### `users` collection

Stores information about each registered user. The document ID is the same as the Firebase Authentication `uid`.

| Field         | Type              | Description                                                                  |
| ------------- | ----------------- | ---------------------------------------------------------------------------- |
| `uid`         | `string`          | The user's unique ID from Firebase Authentication.                           |
| `displayName` | `string`          | The user's public display name.                                              |
| `email`       | `string`          | The user's email address.                                                    |
| `location`    | `GeoPoint`        | The user's geographical location, used for distance-based queries.           |
| `bio`         | `string`          | A short biography or description provided by the user.                       |
| `points`      | `number`          | Gamification points earned by the user for community participation.          |
| `level`       | `number`          | The user's current level, derived from their points.                         |
| `badges`      | `array` of `string` | A list of badges the user has unlocked.                                      |

### `products` collection

Contains all the items (produce, goods, etc.) offered by users for exchange or sale. Note: This collection is referred to as `listings` in the original `DESIGN_DOCUMENT.md`, but implemented as `products` in the code.

| Field          | Type              | Description                                                                    |
| -------------- | ----------------- | ------------------------------------------------------------------------------ |
| `id`           | `string`          | The unique ID of the document (auto-generated by Firestore).                   |
| `name`         | `string`          | The title or name of the product.                                              |
| `description`  | `string`          | A detailed description of the product.                                         |
| `category`     | `string`          | The category of the product (e.g., "Vegetables", "Fruits").                    |
| `imageUrl`     | `string`          | URL to an image or icon representing the product.                              |
| `isForExchange`| `boolean`         | If `true`, the item is available for trade. Otherwise, it might be for sale.   |
| `price`        | `number`          | The monetary price of the item, if applicable.                                 |
| `location`     | `GeoPoint`        | The geographical location of the product, used for distance calculations.      |
| `producerId`   | `string`          | The `uid` of the user who created the listing.                                 |
| `createdAt`    | `Timestamp`       | The date and time when the product was listed.                                 |

### `exchanges` collection

Tracks the entire lifecycle of a transaction or exchange between two users.

| Field       | Type        | Description                                                                    |
| ----------- | ----------- | ------------------------------------------------------------------------------ |
| `id`        | `string`    | The unique ID of the document (auto-generated by Firestore).                   |
| `listingId` | `string`    | A reference to the ID of the product being exchanged.                          |
| `producerId`| `string`    | The `uid` of the user offering the product.                                    |
| `consumerId`| `string`    | The `uid` of the user acquiring the product.                                   |
| `status`    | `string`    | The current state of the exchange (e.g., "proposed", "accepted", "completed"). |
| `createdAt` | `Timestamp` | The date and time when the exchange was initiated.                             |
| `reviews`   | `map`       | A map containing reviews from both the producer and consumer after completion. |

## 4. Navigation and User Flows

This section outlines the primary user journeys within the application, from initial registration to completing an exchange.

### 1. User Registration and Onboarding
1.  **Entry Point**: A new user arrives at the landing page (`/`).
2.  **Sign Up**: The user navigates to the sign-up page (`/signup`) via the "Join the Community" button. They can register using their email and password or with their Google account.
3.  **Onboarding**: After successful registration, the user is redirected to an onboarding flow (`/onboarding`). Here, they are prompted to:
    -   Provide their general location to enable location-based features.
    -   Optionally, add more details to their profile (e.g., a bio).
4.  **Completion**: Once onboarding is complete, they are taken to the main product feed (`/`).

### 2. Browsing and Finding Products
1.  **Main Feed**: The user lands on the main page (`/`), which displays a feed of products sorted by proximity to their location.
2.  **Filtering & Searching**: The user can use the search bar and filter controls to narrow down the results by:
    -   Product name (search term)
    -   Category
    -   Distance
3.  **View Details**: The user clicks on a `ProductCard` to navigate to the product detail page (`/product/[id]`), where they can see more information about the item and the producer.

### 3. Publishing a Product
1.  **Initiation**: An authenticated user clicks the "Share Your Produce" or `+` button, which takes them to the publish page (`/publish`).
2.  **Form Completion**: The user fills out a multi-step form to provide details about their product, including name, description, category, and whether it's for exchange or sale.
3.  **Submission**: Upon submission, a new document is created in the `products` collection in Firestore, and the user is redirected to their newly created listing or their profile page.

### 4. Initiating and Completing an Exchange
1.  **Contact**: From a product detail page, a user (the "consumer") can click a button to initiate an exchange with the "producer."
2.  **Communication**: This action creates a new document in the `exchanges` collection with a "proposed" status and opens a messaging interface (or notifies the producer).
3.  **Status Updates**: Both the producer and consumer can track the status of their ongoing exchanges in their profile (`/profile`) under an "My Exchanges" tab.
4.  **Completion**: Once the exchange is physically completed, either user can mark it as "completed" in the app.
5.  **Review**: After completion, both users are prompted to leave a review for each other, which builds reputation within the community.

## 5. Key Features and Logic

This section details some of the core technical implementations and logic that power the application's key features.

### Real-time Data with Firestore
The application leverages Firestore's real-time capabilities to ensure the data displayed to the user is always up-to-date.
-   **Implementation**: This is achieved using the `onSnapshot` method from the Firebase SDK, as seen in `frontend/src/app/page.tsx`.
-   **How it Works**: `onSnapshot` listens for changes to a Firestore collection (e.g., `products`). Whenever a document is added, modified, or deleted, Firestore pushes the updated data to the client in real-time. The client-side code then updates the state, and React re-renders the UI automatically.
-   **Benefit**: This creates a highly dynamic and responsive user experience, as new products or changes appear instantly without needing a page refresh.

### Geolocation and Distance Calculation
A core feature of the portal is its ability to show users products that are close to them.
-   **User Location**: During onboarding, the user is asked for their location, which is stored as a `GeoPoint` in their `users` document in Firestore.
-   **Distance Logic**: When fetching products, the application:
    1.  Retrieves the logged-in user's `GeoPoint` from their profile.
    2.  For each product, it calculates the distance between the user's location and the product's location using the Haversine formula (implemented in `frontend/src/lib/geolocation.ts`).
    3.  The calculated distance is added to the product object in the client-side state.
-   **Sorting & Filtering**: The product feed is then sorted by this calculated distance, and users can also filter products to be within a specific radius.

### Global State Management with React Context
To avoid prop-drilling and manage state that is needed across many parts of the application, we use the React Context API.
-   **`AuthContext`**:
    -   **Purpose**: Provides information about the current user's authentication status (`user` object, loading state) to any component that needs it.
    -   **Usage**: Wraps the entire application in `layout.tsx`. Components can access the user data using the `useAuth()` hook.
-   **`FilterContext`**:
    -   **Purpose**: Manages the state of the product filters (search term, categories, distance).
    -   **Usage**: Components like the filter sidebar can update the filter state, and the main product feed (`page.tsx`) consumes this state to apply the filters to the displayed products.

## 6. Setup and Development Instructions

Follow these steps to get the frontend application running on your local machine for development and testing purposes.

### Prerequisites

-   **Node.js**: Ensure you have Node.js installed (v18 or later is recommended).
-   **npm** or **yarn**: A package manager for installing dependencies.
-   **Firebase Account**: You will need a Firebase project to connect the application to.

### 1. Clone the Repository
```bash
git clone <repository-url>
cd <repository-folder>
```

### 2. Install Dependencies
Navigate to the `frontend` directory and install the required packages.
```bash
cd frontend
npm install
```

### 3. Configure Firebase
The application needs to connect to a Firebase project to function correctly.
1.  **Get Firebase Config**: Go to your Firebase project's settings and find your web app's configuration object. It will look something like this:
    ```javascript
    const firebaseConfig = {
      apiKey: "YOUR_API_KEY",
      authDomain: "YOUR_AUTH_DOMAIN",
      projectId: "YOUR_PROJECT_ID",
      storageBucket: "YOUR_STORAGE_BUCKET",
      messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
      appId: "YOUR_APP_ID"
    };
    ```
2.  **Update `firebase.ts`**: Open the `frontend/src/lib/firebase.ts` file and replace the placeholder `firebaseConfig` object with your project's actual configuration.

    **Note**: For a real-world application, it is strongly recommended to use environment variables (e.g., via a `.env.local` file) to store these keys instead of hard-coding them directly in the source code.

### 4. Run the Development Server
Once the dependencies are installed and Firebase is configured, you can start the local development server.
```bash
npm run dev
```
This command will start the application using Next.js's Turbopack for maximum speed. You can now open your browser and navigate to `http://localhost:3000` to see the application running. The page will auto-update as you make edits to the source code.
