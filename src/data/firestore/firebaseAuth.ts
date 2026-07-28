/**
 * Firebase Authentication bootstrap.
 *
 * The app's *gameplay* identity is still just a name + role (see `session.ts`),
 * but Firestore's security rules require every client to carry a Firebase auth
 * token. To satisfy that without adding friction, the app signs in
 * anonymously on load; a player who prefers a real account can instead sign in
 * with Google, which also surfaces their display name to pre-fill the login.
 *
 * Like `firebaseApp`, nothing here initializes Firebase until first called, so
 * importing the data layer never forces an auth connection (important for the
 * localStorage fallback and for tests).
 */

import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
  type Auth,
  type User,
} from "firebase/auth";

import { getFirebaseApp, type FirebaseConfig } from "./firebaseApp";

let cachedAuth: Auth | undefined;

/** Returns the singleton `Auth` instance for the configured app. */
export function getFirebaseAuth(config?: FirebaseConfig): Auth {
  if (cachedAuth) return cachedAuth;
  cachedAuth = getAuth(getFirebaseApp(config));
  return cachedAuth;
}

/**
 * Ensures a Firebase user exists, signing in anonymously when none is present.
 * Idempotent: returns the current user if already signed in (anonymously or via
 * a provider), so calling it on every load is safe.
 */
export async function ensureSignedIn(auth: Auth = getFirebaseAuth()): Promise<User> {
  if (auth.currentUser) return auth.currentUser;
  const credential = await signInAnonymously(auth);
  return credential.user;
}

/**
 * Signs in with Google via a popup and returns the user. Replaces an anonymous
 * session with the Google identity (both satisfy `request.auth != null`).
 */
export async function signInWithGoogle(auth: Auth = getFirebaseAuth()): Promise<User> {
  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(auth, provider);
  return credential.user;
}

/** Subscribes to auth-state changes; returns the unsubscribe function. */
export function watchAuth(
  callback: (user: User | null) => void,
  auth: Auth = getFirebaseAuth(),
): () => void {
  return onAuthStateChanged(auth, callback);
}

/** Test hook: clears the cached `Auth` so the next call re-initializes. */
export function resetFirebaseAuthForTesting(): void {
  cachedAuth = undefined;
}
