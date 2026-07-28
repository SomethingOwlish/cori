/**
 * Firestore-backed `ThirdHorizonRepository`.
 *
 * The whole atlas is one document (`thirdHorizon/state`): a small object holding
 * the «вы здесь» marker plus the place overrides and custom places. Storing it in
 * Firestore (not each browser's localStorage) is what lets the master's edits and
 * the party's current location show up live on every player's device — the
 * `subscribe` below is a Firestore `onSnapshot` on that single doc.
 */

import {
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  type DocumentData,
  type DocumentReference,
  type Firestore,
} from "firebase/firestore";

import { emptyState, type ThirdHorizonState } from "../../domain/thirdHorizon";
import type { ThirdHorizonRepository, Unsubscribe } from "../thirdHorizonRepository";
import { getFirestoreDb } from "./firebaseApp";

const DEFAULT_COLLECTION = "thirdHorizon";
const DEFAULT_DOC = "state";

/** Reads a stored document back into a well-formed state, tolerating partial/hand-edited docs. */
function fromDocument(data: DocumentData | undefined): ThirdHorizonState {
  const base = emptyState();
  if (!data || typeof data !== "object") return base;
  return {
    currentSystemId: typeof data.currentSystemId === "string" ? data.currentSystemId : null,
    overrides: data.overrides && typeof data.overrides === "object" ? data.overrides : base.overrides,
    custom: data.custom && typeof data.custom === "object" ? data.custom : base.custom,
  };
}

export class FirestoreThirdHorizonRepository implements ThirdHorizonRepository {
  private readonly docRef: DocumentReference<DocumentData>;

  constructor(
    db: Firestore = getFirestoreDb(),
    collectionPath: string = DEFAULT_COLLECTION,
    docId: string = DEFAULT_DOC,
  ) {
    this.docRef = doc(db, collectionPath, docId);
  }

  async load(): Promise<ThirdHorizonState | null> {
    const snapshot = await getDoc(this.docRef);
    return snapshot.exists() ? fromDocument(snapshot.data()) : null;
  }

  async save(state: ThirdHorizonState): Promise<void> {
    // Plain object of primitives/maps/arrays — Firestore stores it as-is.
    await setDoc(this.docRef, {
      currentSystemId: state.currentSystemId,
      overrides: state.overrides,
      custom: state.custom,
    });
  }

  subscribe(listener: (state: ThirdHorizonState | null) => void): Unsubscribe {
    return onSnapshot(this.docRef, (snapshot) => {
      listener(snapshot.exists() ? fromDocument(snapshot.data()) : null);
    });
  }
}
