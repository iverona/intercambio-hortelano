# Portal de Intercambio Hortelano - Design Document

This document outlines the technical and functional specifications for the application. It is a living document and will be updated as the project evolves.

## 1. Proposed Technology Stack

*   **Frontend Framework: Next.js (using React)**
    *   **Why?** Next.js offers excellent performance (SSR/SSG), a great developer experience, and a clear path to a future mobile app using React Native.

*   **Backend & Database: Firebase**
    *   **Why?** Aligns with the Google Cloud ecosystem requirement and allows for rapid development.
    *   **Services:**
        *   **Firestore:** NoSQL database for all application data (users, listings, etc.) with real-time and geospatial capabilities.
        *   **Firebase Authentication:** Secure user registration and login.
        *   **Cloud Functions for Firebase:** For server-side logic.
        *   **Firebase Hosting:** For web application deployment.

*   **Geolocation:** Browser's native Geolocation API combined with Firestore's `GeoPoint` data type for distance-based queries.

## 2. Initial Data Model (Firestore)

### `users` collection
*   **Description:** Stores information about each user.
*   **Fields:** `userId`, `displayName`, `email`, `location` (GeoPoint), `bio`, `points`, `level`, `badges` (array).

### `listings` collection
*   **Description:** Contains all items offered by users.
*   **Fields:** `listingId`, `title`, `description`, `category`, `iconId`, `isForExchange` (boolean), `price`, `location` (GeoPoint), `producerId` (reference to user).

### `exchanges` collection
*   **Description:** Tracks the lifecycle of a transaction.
*   **Fields:** `exchangeId`, `listingId`, `producerId`, `consumerId`, `status` (e.g., "proposed", "accepted", "completed"), `createdAt`, `reviews`.

## 3. Gamification Concept

*   Award points for positive actions (creating listings, completing exchanges, receiving good reviews).
*   Points contribute to a user's level and unlock displayable badges on their profile to encourage participation.

## 4. User Stories

### Core User Journeys

#### 1. User Registration & Onboarding
*   1.1. **As a new user,** I want to sign up for an account using my email and password or my Google account so that I can join the community. ✅
*   1.2. **As a new user,** I want to be prompted to share my general location (e.g., city or postal code) during onboarding so the app can show me relevant local listings. ✅
*   1.3. **As a new user,** I want a brief tour or explanation of how the points and badges system works to get me excited about participating.

#### 2. Managing Listings (Producer Role)
*   2.1. **As a user,** I want to create a new listing for a product I want to offer. ✅
*   2.2. **As a user,** when creating a listing, I want to add a title, a short description, select a category, and choose an icon that represents my product. ✅
*   2.3. **As a user,** I want to specify if my item is for exchange, for a price, or both. ✅
*   2.4. **As a user,** I want to see and manage all the listings I have created on my profile page. ✅

#### 3. Browsing & Finding Products (Consumer Role)
*   3.1. **As a user,** I want to see a main feed of listings, prioritized by those closest to my location. ✅
*   3.2. **As a user,** I want to be able to filter listings by category (e.g., "Vegetables", "Fruits", "Honey"). ✅
*   3.3. **As a user,** I want to be able to search for specific items by name. ✅
*   3.4. **As a user,** I want to click on a listing to view more details, including information about the producer.

#### 4. Initiating & Completing Exchanges
*   4.1. **As a user,** I want to be able to contact the producer of a listing to propose an exchange or purchase.
*   4.2. **As a user,** I want to have a simple messaging interface to communicate with other users about an exchange.
*   4.3. **As a user,** I want to be able to accept or decline an exchange proposal.
*   4.4. **As a user,** after an exchange is complete, I want to be able to mark it as "completed" and leave a review for the other person.

#### 5. Producer-Consumer Interaction
*   5.1. **As a producer,** I want to receive a notification when a consumer is interested in one of my listings.
*   5.2. **As a consumer,** I want to receive a notification when a producer responds to my inquiry or accepts my proposal.
*   5.3. **As a user,** I want to see the status of my ongoing exchanges (e.g., "Proposed", "Accepted", "Completed") in a dedicated section of my profile.

#### 6. Reputation and Trust
*   6.1. **As a user,** I want to see a producer's overall rating and read reviews from other users before I decide to interact with them.
*   6.2. **As a user,** I want my profile to display my level, badges, and average rating to build trust within the community.
*   6.3. **As a user,** I want the review system to be simple, perhaps a star rating and an optional short comment.

## 5. UI/UX Design Proposal

**Overall Aesthetic:**
*   **Theme:** Light, airy, and natural. We'll use a color palette with earthy tones (greens, browns, beige) and a clean, sans-serif font for readability.
*   **Simplicity:** The interface will be uncluttered. We'll use generous white space to make content easy to digest.
*   **Iconography:** We will rely on a consistent set of clean, simple icons for product categories and actions, reinforcing the non-commercial, community feel.

---

#### 1. Home Screen (Main Listings Feed)

*   **Layout:** A simple, scrollable grid or list view. Each item in the grid is a "card."
*   **Header:**
    *   A clean logo.
    *   A prominent **Search Bar** ("Search for tomatoes, honey...").
    *   A **Filter** button. Tapping this would open a small modal or drawer with filtering options:
        *   **Category:** A list of checkboxes (e.g., Vegetables, Fruits, Handicrafts).
        *   **Exchange Type:** Radio buttons for "All," "Exchange Only," "For Sale."
        *   **Distance:** A slider or a set of radio buttons (e.g., "Under 1km," "Under 5km," "Under 10km").
    *   A **Profile Icon** that takes the user to their profile page.
*   **Listing Card:** Each card would be minimalist and show essential information at a glance:
    *   Large, clear **Icon** of the product.
    *   **Title** of the listing.
    *   **Distance** from the user (e.g., "2.5 km away").
    *   **Price** or an **"Exchange"** icon.
    *   The producer's **Profile Picture** (small) and **Display Name**.
*   **Floating Action Button (FAB):** A simple `+` button fixed to the bottom corner of the screen for creating a new listing.

---

#### 2. Listing Detail Screen

*   **Layout:** A clean, single-column view.
*   **Content:**
    *   Large **Icon** and **Title**.
    *   Detailed **Description**.
    *   **Producer Information:** A tappable section showing the producer's profile picture, name, and community rating/level.
    *   **Map View:** A small, embedded map showing the general area of the listing.
    *   **Call-to-Action Button:** A prominent button: "Propose Exchange" or "Inquire".

---

#### 3. User Profile & Dashboard

*   **Layout:** A tabbed interface.
*   **Header Section:**
    *   User's profile picture, display name, and location.
    *   Gamification stats: **Level**, **Points**, and **Badges**.
*   **Tabs:**
    *   **My Listings:** A grid of the user's created listings.
    *   **My Exchanges:** A list of ongoing and completed exchanges with their status.
    *   **Reviews:** Reviews they've received.
    *   **Settings:** To edit their profile.

---

#### 4. New Listing Form

*   **Layout:** A simple, multi-step form to avoid overwhelming the user.
*   **Steps:**
    1.  **"What are you offering?"** - Title and category icon selection.
    2.  **"Tell us more."** - Description.
    3.  **"How do you want to exchange?"** - Toggles for "Exchange," "For a Price."
    4.  **"Confirm"** - A summary before posting.
