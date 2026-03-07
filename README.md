# Longhorn Living

A full-stack mobile housing discovery app built for University of Texas at Austin students. Longhorn Living replaces generic listing platforms with a personalized, swipe-based experience that factors in campus proximity, budget, and lifestyle preferences from the moment a user signs up.

Built with React Native (TypeScript), Firebase, and Expo. Runs on iOS and Android from a single codebase.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Navigation and Auth Flow](#navigation-and-auth-flow)
- [Screen Reference](#screen-reference)
- [Firebase and Backend](#firebase-and-backend)
- [State Management](#state-management)
- [Key Technical Systems](#key-technical-systems)
- [File and Folder Reference](#file-and-folder-reference)
- [Design Decisions and Tradeoffs](#design-decisions-and-tradeoffs)

---

## Overview

Generic listing sites like Zillow or Apartments.com have no awareness of UT Austin's campus, student budgets, or commute distance. Longhorn Living solves this by personalizing the entire experience: users set preferences on signup, swipe through scored listings, and land on a home feed organized into smart carousels sorted by match score.

The app handles a complete auth lifecycle (signup, email verification, onboarding, and redo flows), real-time Firestore sync, gesture-based UI components built without third-party libraries, and platform-aware map integration.

---

## Tech Stack

### Frontend

| Layer | Technology |
|---|---|
| Framework | React Native with TypeScript |
| Build toolchain | Expo (managed workflow) |
| Navigation | React Navigation (Native Stack + Bottom Tabs) |
| UI components | Expo LinearGradient, BlurView, MaskedView |
| Gestures | React Native PanResponder (custom, no third-party library) |
| Animations | React Native Animated API |
| Maps | React Native Maps |

### Backend and Services

| Layer | Technology |
|---|---|
| Authentication | Firebase Auth |
| Database | Cloud Firestore (NoSQL) |
| Real-time sync | Firestore `onSnapshot` listener |
| Geocoding | LocationIQ REST API |
| Writes | Firestore `setDoc` with `merge: true` for non-destructive partial updates |

---

## Architecture

```
App
├── AuthContext                     Global Firebase Auth state, onboarding flag
├── PreferencesContext              Real-time Firestore sync for preferences + saved listings
│
├── AppNavigator                    Conditional routing: 4-state auth/onboarding gate
│   ├── Auth Stack
│   │   ├── LoginScreen
│   │   ├── VerifyEmailScreen
│   │   └── ForgotPasswordScreen
│   ├── Onboarding Stack
│   │   ├── PreferencesScreen
│   │   └── SwipeScreen
│   └── Main Tabs
│       ├── HomeScreen
│       ├── Search (BrowseScreen)
│       └── ProfileScreen
│           └── (Detail screens pushed onto stack)
│               ├── ApartmentListingDetailsScreen
│               └── RoomListingDetailsScreen
│
├── services/
│   └── userService.ts              All Firestore CRUD, abstracted from components
│
└── utils/
    ├── matchingAlgorithm.js        0-100% match score per listing
    ├── locationUtils.js            Haversine formula, distance filtering
    └── distanceUtils.ts            Distance formatting utilities
```

### Layering Principles

- **Service layer (`userService.ts`)** owns all Firestore reads and writes. No component calls Firestore directly.
- **Two contexts** (`AuthContext`, `PreferencesContext`) are the sole source of truth for global state. Components read from context, never from local component state that duplicates server data.
- **Local/remote state split** is applied deliberately throughout: UI state (sliders, filter toggles) lives in local component state for responsiveness; Firestore writes happen only on intentional user action to avoid excessive database traffic.
- **Utility modules** (`matchingAlgorithm.js`, `locationUtils.js`) are pure functions with no side effects, called from multiple screens without duplication.

---

## Navigation and Auth Flow

`AppNavigator` evaluates three conditions on every mount and auth state change, routing the user into one of four possible states:

```
onAuthStateChanged fires
        |
        ├── No user                          --> Login Stack
        |
        ├── User, emailVerified = false      --> Verify Email Screen
        |
        ├── User, verified, onboarding = false --> Preferences --> Swipe --> Main Tabs
        |
        └── User, verified, onboarding = true --> Main Tabs (Home)
```

A minimum 4-second splash screen runs on every launch while auth state and Firestore onboarding status are fetched in the background. This prevents navigation flicker before state is known.

The onboarding flow can be re-triggered from the Profile screen ("Redo Preferences"). This resets `hasCompletedOnboarding` in Firestore and passes an `isRedoingPreferences` flag through route params so the Swipe screen knows to return to Main Tabs rather than treat completion as a first-time event.

---

## Screen Reference

### Login Screen

- Email/password authentication via `signInWithEmailAndPassword`
- `AnimatedInput` component: floating label that interpolates font size and vertical position on focus and when the field has a value
- Firebase error codes mapped to user-readable strings via `getErrorMessage()`
- A 2-second artificial loading delay surfaces `CustomLoadingScreen` so the auth transition does not feel instant and jarring
- Navigation after login is handled entirely by `AppNavigator` watching `onAuthStateChanged` — no manual `navigate()` call on success

### Verify Email Screen

- Shown when `user.emailVerified === false`
- "Check Status" calls `reload(auth.currentUser)` to refresh the Firebase user token, then creates a new object reference to force a React re-render — necessary because Firebase mutates the user object in place

### Forgot Password Screen

- Client-side `@` check before any Firebase call to avoid unnecessary network traffic
- `sendPasswordResetEmail` with success state that disables input and shows a confirmation
- Alert on success navigates the user back to Login automatically

### Preferences Screen

- Sliders for price range, bedrooms, bathrooms, and max distance
- Amenity chip toggles: WiFi, Gym, Pool, Parking, Furnished, Pet Friendly
- Location search via LocationIQ REST API, debounced 2 seconds, bounded to Austin's geographic bounding box
- Local state pattern: slider movements update `localPreferences` in component state immediately for smooth UX; Firestore is only written when the user taps "Find your dream apartment"
- Default location: University of Texas at Austin (30.2853, -97.7320)

### Swipe Screen

- Two-card stack: the active card is visible on top, the next card is rendered behind it
- Each card displays photo, name, address, price, bed/bath/distance chips, amenities, and a match score badge with a gradient fill
- `SwipeCard` manages gesture tracking via `PanResponder` held in a `useRef` so the same instance persists across renders — recreating it mid-drag breaks tracking
- `position` and `swipeOpacity` are also refs, not state, so gesture updates do not trigger re-renders during a drag
- 25% of screen width is the swipe threshold for a commit; below that, the card springs back
- Card tilt: `Math.round` applied to rotation, clamped to ±10 degrees
- Completing all cards or tapping Skip calls `handleFinishSwiping()`, which writes `hasCompletedOnboarding: true` to Firestore and updates `AuthContext` immediately so the navigator re-routes without a Firestore round-trip

### Home Screen

- Six horizontally scrollable carousels, each filtered and sorted by match score:
  - Recently Viewed
  - Saved Listings
  - Meets Your Budget (price <= maxPrice preference)
  - Close to You (within 2 miles)
  - Has All Your Amenities
  - Loved by Longhorns (top 6 by score overall)
- Filter modal is a draggable bottom sheet built with `PanResponder`: drag >150px dismisses, below that it springs back
- Two-state filter pattern: changes go into `tempVisibleSections` and are only committed to `visibleSections` and Firestore on "Apply Filters" — changes are discarded if the modal is dismissed
- `LayoutAnimation` wraps the save toggle so section appear/disappear is animated automatically
- Tab press while the tab is focused scrolls to the top via a `ScrollView` ref

### Search / Browse Screen

- Toggle between Map View and List View
- Map View: `MapView` with custom SVG pin markers (React.memo with `tracksViewChanges` disabled after 100ms to stop unnecessary re-renders), UT Austin campus marker, optional user location marker, and `animateToRegion()` for a smooth reset
- List View: `FlatList` sorted by match score descending, with a BlurView header
- Search modal is a draggable bottom sheet; results sorted: exact match first, then `startsWith`, then alphabetical

### Profile Screen

- Shows first letter of email as avatar, member since date parsed from Firebase auth metadata
- Location update: inline LocationIQ search debounced 500ms, writes lat/lon directly to Firestore on selection
- "Reset to UT" only renders when a custom location is active; restores UT Austin coordinates
- "Redo Preferences" calls `resetUserOnboarding()` then navigates to Preferences with `isRedo: true`
- "Check Status" calls `reloadUser()` to re-fetch the auth token and check `emailVerified` without signing the user out

### Apartment Listing Details Screen

- Building-level view: all units listed as `UnitCard` sub-components
- `useEffect` joins the apartment record to its parent building document (falls back to the apartment object itself if no building is found)
- Match score is computed after the data join — the algorithm requires building-level fields that unit records do not store individually
- Distance is recalculated live when GPS coordinates are available; falls back to the static distance stored in the listing
- "Get Directions" opens Apple Maps on iOS with a Google Maps fallback via `Linking.canOpenURL()`
- Address supports long-press to copy via `Clipboard`

### Room Listing Details Screen

- Individual unit view with lease info and contact details
- `animatedWidth` ref drives a progress bar that animates from 0 to the match score over 1 second on mount
- `roomData` is a merged object where unit fields take priority over parent building fields
- Distance chip is a `TouchableOpacity` that opens Maps; bed/bath chips are plain `View` elements — tappability is intentional only where it leads somewhere

---

## Firebase and Backend

### Firestore User Document Schema

```
users/{uid}
├── uid                      string   Firebase Auth UID
├── email                    string
├── createdAt / updatedAt    Firestore serverTimestamp()
├── hasCompletedOnboarding   boolean  Controls routing on every login
├── onboardingCompletedAt    string   ISO timestamp
├── savedApartments          string[] Array of saved listing IDs
├── filterPreferences        object   Which home carousels are visible
└── preferences
    ├── minPrice / maxPrice  number   Rent range in dollars
    ├── bedrooms / bathrooms number
    ├── maxDistance          number   Miles from reference location
    ├── wifi / gym / pool /
        parking / furnished /
        petFriendly          boolean  Amenity flags
    └── location             { name: string, lat: number, lon: number }
```

### Firebase Auth Operations

| Operation | Method |
|---|---|
| Sign in | `signInWithEmailAndPassword` |
| Sign up | `createUserWithEmailAndPassword`, then `createUserProfile()` |
| Email verification | `sendEmailVerification(auth.currentUser)` |
| Refresh verification status | `reload(auth.currentUser)` |
| Password reset | `sendPasswordResetEmail` |
| Auth state listener | `onAuthStateChanged` in AuthContext |

### Firestore Service Layer (`userService.ts`)

All Firestore access goes through `userService.ts`. Components call service functions; they do not import or call Firestore directly.

| Function | Operation |
|---|---|
| `createUserProfile` | `setDoc` on signup |
| `getUserProfile` | `getDoc` |
| `updateUserProfile` | `setDoc` with `merge: true` |
| `updateUserPreferences` | `setDoc` with `merge: true` on preferences object |
| `saveApartment / unsaveApartment` | Read-modify-write on `savedApartments` array |
| `checkUserOnboardingStatus` | `getDoc`, read `hasCompletedOnboarding` |
| `setUserOnboardingComplete` | `updateDoc` sets flag to `true` |
| `resetUserOnboarding` | `updateDoc` sets flag to `false` |

### Real-Time Sync

`PreferencesContext` uses `onSnapshot()` rather than a one-time `getDoc()`. The listener is initialized on user login and torn down in the `useEffect` cleanup function on logout to prevent memory leaks. This keeps preferences and saved listings current across the app without manual refresh calls.

---

## State Management

### AuthContext

Wraps the entire app. Provides:

- `user`, `loading`, `error`
- `hasCompletedOnboarding`, `setHasCompletedOnboarding`
- Auth action functions: `signInWithEmail`, `signUpWithEmail`, `signOut`, `resetPassword`, `sendVerificationEmail`, `reloadUser`

`setHasCompletedOnboarding` is exposed so the Swipe screen can update context immediately after completing onboarding — this avoids waiting for a Firestore read to propagate through `onAuthStateChanged` before the navigator re-routes.

### PreferencesContext

Provides:

- `preferences`, `setPreferences`
- `savedIds`, `toggleSave`, `loading`

`setPreferences` updates local context state only — it does not write to Firestore. Writes happen only through explicit service calls triggered by user action. `toggleSave` optimistically updates `savedIds` locally before confirming with Firestore.

On logout, the `useEffect` dependency on `user?.uid` causes the listener to be torn down and state to reset to defaults.

Firestore field names are mapped to context field names on read: `bedrooms` becomes `beds`, `maxDistance` becomes `distance`. This keeps the Firestore schema and the component API independently maintainable.

---

## Key Technical Systems

### Matching Algorithm (`matchingAlgorithm.js`)

Produces a 0-100% match score for every listing based on the user's current preferences. Factors: price range overlap, bedroom count, bathroom count, distance from the user's reference location, and amenity matches. The score is displayed as a gradient badge on swipe cards, detail screens, home carousels, and the search list sort order. Listings are enriched with building-level data before scoring so the algorithm has access to all relevant fields.

### Distance Calculation (`locationUtils.js`)

Uses the Haversine formula to compute real-world distance between two lat/lon coordinate pairs. Called in `getEnrichedListings()` so distances reflect the user's current saved location dynamically. Distances are rounded to one decimal place. Accurate enough for sub-50-mile proximity use cases; cheaper and simpler than a routing API call per listing.

### Gesture System (PanResponder)

The filter modal on Home and the search modal on Browse are both draggable bottom sheets built with React Native's `PanResponder` — no third-party gesture library. Key behaviors:

- `dy` (vertical drag delta) drives `translateY` and `opacity` in real time via `Animated.event`
- Drag < 150px: spring-back animation returns the modal to its open position
- Drag >= 150px: dismiss animation closes the modal

### LocationIQ Geocoding

REST API that converts text queries to lat/lon coordinates. Bounded to Austin's geographic bounding box. Results filtered to US only and capped at 5 per query. Debounced at 500ms in Profile and 2000ms in Preferences to stay within rate limits and avoid redundant network calls during typing.

### Map Integration

Custom SVG pin markers are wrapped in `React.memo` with `tracksViewChanges` set to `false` after 100ms. Without this, React Native Maps re-renders every marker on every map state change, which causes visible jank when the map region updates. The 100ms window allows the initial render to complete before tracking is disabled.

---

## File and Folder Reference

### Core Files

| File | Responsibility |
|---|---|
| `AppNavigator.tsx` | 4-state conditional routing (auth, verification, onboarding, main) |
| `AuthContext.tsx` | Firebase Auth wrapper, onboarding flag, global auth state |
| `PreferencesContext.tsx` | Preferences and saved listings, real-time Firestore sync |
| `userService.ts` | All Firestore CRUD operations, abstracted from components |
| `matchingAlgorithm.js` | 0-100% match score calculation |
| `locationUtils.js` | Haversine distance formula, distance-based filtering |
| `distanceUtils.ts` | Distance formatting helpers |

### Screens

| Screen | Key Responsibility |
|---|---|
| `LoginScreen.tsx` | Auth, animated floating label inputs, error mapping |
| `VerifyEmailScreen.tsx` | Verification flow, forced re-render after `reload()` |
| `ForgotPasswordScreen.tsx` | Password reset, client-side validation gate |
| `PreferencesScreen.tsx` | Preference form, local/remote state split, LocationIQ search |
| `SwipeScreen.tsx` | Card stack, PanResponder swipe, onboarding completion |
| `HomeScreen.tsx` | 6 scored carousels, PanResponder filter modal, temp filter state |
| `Search.tsx` | Map/list toggle, SVG markers, search modal, match-sorted FlatList |
| `ProfileScreen.tsx` | Account info, location edit, preferences redo, sign out |
| `ApartmentListingDetailsScreen.tsx` | Building detail, data join, live distance, unit list |
| `RoomListingDetailsScreen.tsx` | Unit detail, animated score bar, merged data object |

### Reusable Components

| Component | Description |
|---|---|
| `SwipeCard.tsx` | Gesture-driven swipe card; PanResponder in ref, position and opacity as refs |
| `ImageCarousel.tsx` | Paged photo carousel; ScrollView ref for programmatic control, dot indicator |
| `MainTabs.tsx` | Custom animated tab bar; MaskedView gradient icons, BlurView/Android fallback |
| `CustomLoadingScreen.tsx` | Branded loading overlay; staggered dot animation, transparent Modal |

### Data

| File | Description |
|---|---|
| `buildings.js` | Static building records (name, address, coordinates, images, amenities) |
| `listings.js` | Static listing records (units, price, bed/bath, distance, building reference) |

---

## Design Decisions and Tradeoffs

**Why local state before Firestore writes?**
Slider components need to update at 60fps. Writing to Firestore on every `onValueChange` event would generate hundreds of writes per session per user. The local/remote state split keeps the UI smooth and Firestore writes intentional and infrequent.

**Why no third-party gesture library for modals?**
React Native's `PanResponder` is sufficient for the two drag-to-dismiss modals in this app. Adding a gesture library (Reanimated, Gesture Handler) introduces a native module dependency and additional configuration complexity that is not warranted for this use case.

**Why Firestore `merge: true` on every write?**
Firestore's `setDoc` without `merge: true` overwrites the entire document. Using `merge: true` on all updates means partial writes (e.g., updating only `preferences.maxPrice`) do not accidentally clear unrelated fields like `savedApartments`. This is the defensive default throughout the service layer.

**Why expose `setHasCompletedOnboarding` from AuthContext?**
After the Swipe screen completes onboarding, the app needs to navigate to Main Tabs immediately. Waiting for `onAuthStateChanged` to fire again and re-fetch Firestore would introduce a perceptible delay. Updating context directly from the Swipe screen lets the navigator re-route on the same render cycle.

**Why refs instead of state for gesture values?**
`PanResponder`, `position`, and `swipeOpacity` are all held in `useRef`. State updates trigger re-renders; gesture handlers fire on every frame. Using refs allows the gesture system to track position and opacity in real time through the `Animated` API without causing unnecessary component re-renders during a drag.

**Why Haversine over a routing API?**
Routing API calls cost money and time per request. For proximity sorting across dozens of listings, crow-flies distance via Haversine is accurate enough and computed instantly on-device. The app surfaces this as an approximation and lets users open a maps app for actual directions.

---

*Longhorn Living v1.0 — React Native + Firebase — University of Texas at Austin*
