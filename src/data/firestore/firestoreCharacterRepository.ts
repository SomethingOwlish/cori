/**
 * Firestore-backed `CharacterRepository`.
 *
 * Characters live in a single collection (default `characters`), one document
 * per character keyed by the character's `id`. A `FirestoreDataConverter` maps
 * between the domain model and the stored document via the pure functions in
 * `characterConverter`, so all serialization logic stays in one testable place.
 */

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
  type CollectionReference,
  type DocumentData,
  type Firestore,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

import type { Character } from "../../domain/coriolis";
import type { CharacterRepository, Unsubscribe } from "../characterRepository";
import {
  characterToDocument,
  documentToCharacter,
  type CharacterDocument,
} from "./characterConverter";
import { getFirestoreDb } from "./firebaseApp";

const DEFAULT_COLLECTION = "characters";

/** Bridges the domain `Character` and its Firestore document representation. */
const characterConverter: FirestoreDataConverter<Character> = {
  toFirestore(character: Character): DocumentData {
    return characterToDocument(character) as unknown as DocumentData;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): Character {
    return documentToCharacter(snapshot.id, snapshot.data() as CharacterDocument);
  },
};

export class FirestoreCharacterRepository implements CharacterRepository {
  private readonly collectionRef: CollectionReference<Character>;

  /**
   * @param db Firestore instance; defaults to the lazily-initialized singleton.
   * @param collectionPath Collection name; defaults to `characters`.
   */
  constructor(db: Firestore = getFirestoreDb(), collectionPath: string = DEFAULT_COLLECTION) {
    this.collectionRef = collection(db, collectionPath).withConverter(characterConverter);
  }

  async get(id: string): Promise<Character | null> {
    const snapshot = await getDoc(doc(this.collectionRef, id));
    return snapshot.exists() ? snapshot.data() : null;
  }

  async list(): Promise<Character[]> {
    const snapshot = await getDocs(this.collectionRef);
    return snapshot.docs.map((d) => d.data());
  }

  async save(character: Character): Promise<void> {
    await setDoc(doc(this.collectionRef, character.id), character);
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(this.collectionRef, id));
  }

  subscribe(id: string, callback: (character: Character | null) => void): Unsubscribe {
    return onSnapshot(doc(this.collectionRef, id), (snapshot) => {
      callback(snapshot.exists() ? snapshot.data() : null);
    });
  }
}
