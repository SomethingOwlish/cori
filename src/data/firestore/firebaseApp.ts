/**
 * Lazy Firebase / Firestore bootstrap.
 *
 * Configuration comes from `VITE_FIREBASE_*` environment variables (see
 * `.env.example`). Nothing is initialized until `getFirebaseApp` /
 * `getFirestoreDb` is first called, so importing the data layer never forces a
 * Firebase connection — important for tests and for code paths that only touch
 * the in-memory repository.
 */

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

/**
 * Reads Firebase config from the Vite env. Throws a clear error listing every
 * missing key rather than letting Firebase fail deep in initialization.
 */
export function readFirebaseConfigFromEnv(env: ImportMetaEnv = import.meta.env): FirebaseConfig {
  const config = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  };

  const missing = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `Missing Firebase configuration: ${missing.join(", ")}. ` +
        "Set the corresponding VITE_FIREBASE_* variables (see .env.example).",
    );
  }

  return config as FirebaseConfig;
}

let cachedApp: FirebaseApp | undefined;
let cachedDb: Firestore | undefined;

/**
 * Returns the singleton `FirebaseApp`, initializing it on first use. Reuses an
 * app already registered under the default name so hot reloads don't double
 * initialize. Pass `config` to override the env-derived configuration.
 */
export function getFirebaseApp(config?: FirebaseConfig): FirebaseApp {
  if (cachedApp) return cachedApp;
  cachedApp = getApps().length > 0 ? getApp() : initializeApp(config ?? readFirebaseConfigFromEnv());
  return cachedApp;
}

/** Returns the singleton Firestore instance for the configured app. */
export function getFirestoreDb(config?: FirebaseConfig): Firestore {
  if (cachedDb) return cachedDb;
  cachedDb = getFirestore(getFirebaseApp(config));
  return cachedDb;
}

/** Test hook: clears the cached app/db so the next call re-initializes. */
export function resetFirebaseAppForTesting(): void {
  cachedApp = undefined;
  cachedDb = undefined;
}
