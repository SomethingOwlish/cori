/**
 * Persistence layer — public API.
 *
 * UI and application code should import the repository contract and an
 * implementation from here rather than reaching into individual modules.
 */

export type { CharacterRepository, Unsubscribe } from "./characterRepository";
export { InMemoryCharacterRepository } from "./inMemoryCharacterRepository";
export { LocalStorageCharacterRepository } from "./localStorageCharacterRepository";

// Campaign persistence
export type { CampaignRepository } from "./campaignRepository";
export { LocalStorageCampaignRepository } from "./localStorageCampaignRepository";

// Firestore implementation
export {
  characterToDocument,
  documentToCharacter,
  CURRENT_SCHEMA_VERSION,
  type CharacterDocument,
} from "./firestore/characterConverter";
export {
  getFirebaseApp,
  getFirestoreDb,
  readFirebaseConfigFromEnv,
  resetFirebaseAppForTesting,
  type FirebaseConfig,
} from "./firestore/firebaseApp";
export { FirestoreCharacterRepository } from "./firestore/firestoreCharacterRepository";
