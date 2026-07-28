/**
 * Firestore-backed `CampaignRepository`.
 *
 * Campaigns live in a single collection (default `campaigns`), one document per
 * campaign keyed by the campaign's `id`. Unlike characters, a campaign is a flat
 * object of primitives plus a `playerNames` string array, so a small inline
 * converter is enough — no separate converter module is needed.
 *
 * Storing campaigns in Firestore (rather than each browser's localStorage) is
 * what lets a Game Master create a campaign on one device and a player join by
 * code from another: every client reads and writes the same shared collection.
 */

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  type CollectionReference,
  type DocumentData,
  type Firestore,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

import type { Campaign } from "../../domain/campaign";
import type { CampaignRepository } from "../campaignRepository";
import { getFirestoreDb } from "./firebaseApp";

const DEFAULT_COLLECTION = "campaigns";

/**
 * Bridges the domain `Campaign` and its Firestore document. The `id` is the
 * document id, so it is dropped from the stored fields and restored on read.
 * Reads are defensive: a partially-written or hand-edited document still yields
 * a well-formed `Campaign` rather than `undefined` fields.
 */
const campaignConverter: FirestoreDataConverter<Campaign> = {
  toFirestore(campaign: Campaign): DocumentData {
    const { id: _id, ...fields } = campaign;
    return fields;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): Campaign {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      name: typeof data.name === "string" ? data.name : "",
      gmName: typeof data.gmName === "string" ? data.gmName : "",
      joinCode: typeof data.joinCode === "string" ? data.joinCode : "",
      playerNames: Array.isArray(data.playerNames)
        ? data.playerNames.filter((n): n is string => typeof n === "string")
        : [],
      createdAt: typeof data.createdAt === "number" ? data.createdAt : 0,
    };
  },
};

export class FirestoreCampaignRepository implements CampaignRepository {
  private readonly collectionRef: CollectionReference<Campaign>;

  /**
   * @param db Firestore instance; defaults to the lazily-initialized singleton.
   * @param collectionPath Collection name; defaults to `campaigns`.
   */
  constructor(db: Firestore = getFirestoreDb(), collectionPath: string = DEFAULT_COLLECTION) {
    this.collectionRef = collection(db, collectionPath).withConverter(campaignConverter);
  }

  async get(id: string): Promise<Campaign | null> {
    const snapshot = await getDoc(doc(this.collectionRef, id));
    return snapshot.exists() ? snapshot.data() : null;
  }

  async list(): Promise<Campaign[]> {
    const snapshot = await getDocs(this.collectionRef);
    return snapshot.docs.map((d) => d.data());
  }

  async save(campaign: Campaign): Promise<void> {
    await setDoc(doc(this.collectionRef, campaign.id), campaign);
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(this.collectionRef, id));
  }
}
