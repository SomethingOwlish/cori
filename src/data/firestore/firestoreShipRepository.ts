/**
 * Firestore-backed `ShipRepository`.
 *
 * Ships live in a single collection (default `ships`), one document per ship
 * keyed by the ship's `id`, each carrying a `campaignId`. Querying by
 * `campaignId` returns a campaign's fleet (active + archived); `onSnapshot` on
 * that query is what lets the master's build and archival show up live on every
 * crew member's device — same pattern as the campaign/atlas repositories.
 */

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  where,
  type CollectionReference,
  type DocumentData,
  type Firestore,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

import type { Ship } from "../../domain/coriolis";
import type { ShipRepository, Unsubscribe } from "../shipRepository";
import { getFirestoreDb } from "./firebaseApp";

const DEFAULT_COLLECTION = "ships";

/** Deep-clean an object of `undefined` keys — Firestore rejects `undefined`. */
function clean<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const shipConverter: FirestoreDataConverter<Ship> = {
  toFirestore(ship: Ship): DocumentData {
    const { id: _id, ...fields } = ship;
    return clean(fields);
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): Ship {
    const data = snapshot.data();
    const asArray = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
    return {
      id: snapshot.id,
      campaignId: typeof data.campaignId === "string" ? data.campaignId : "",
      name: typeof data.name === "string" ? data.name : "",
      classId: typeof data.classId === "string" ? data.classId : "",
      typeName: typeof data.typeName === "string" ? data.typeName : undefined,
      shipyardId: typeof data.shipyardId === "string" ? data.shipyardId : undefined,
      problem: data.problem && typeof data.problem === "object" ? data.problem : undefined,
      debtOverride: typeof data.debtOverride === "number" ? data.debtOverride : undefined,
      modules: asArray(data.modules),
      weapons: asArray(data.weapons),
      upgrades: asArray(data.upgrades),
      crew: data.crew && typeof data.crew === "object" ? data.crew : {},
      criticalDamage: typeof data.criticalDamage === "string" ? data.criticalDamage : undefined,
      cargo: typeof data.cargo === "string" ? data.cargo : undefined,
      notes: typeof data.notes === "string" ? data.notes : undefined,
      log: asArray(data.log),
      createdAt: typeof data.createdAt === "number" ? data.createdAt : 0,
      createdBy: typeof data.createdBy === "string" ? data.createdBy : undefined,
      archived: data.archived === true,
      archivedAt: typeof data.archivedAt === "number" ? data.archivedAt : undefined,
    };
  },
};

export class FirestoreShipRepository implements ShipRepository {
  private readonly collectionRef: CollectionReference<Ship>;

  constructor(db: Firestore = getFirestoreDb(), collectionPath: string = DEFAULT_COLLECTION) {
    this.collectionRef = collection(db, collectionPath).withConverter(shipConverter);
  }

  async listByCampaign(campaignId: string): Promise<Ship[]> {
    const snapshot = await getDocs(query(this.collectionRef, where("campaignId", "==", campaignId)));
    return snapshot.docs.map((d) => d.data());
  }

  async get(id: string): Promise<Ship | null> {
    const snapshot = await getDoc(doc(this.collectionRef, id));
    return snapshot.exists() ? snapshot.data() : null;
  }

  async save(ship: Ship): Promise<void> {
    await setDoc(doc(this.collectionRef, ship.id), ship);
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(this.collectionRef, id));
  }

  subscribe(campaignId: string, listener: (ships: Ship[]) => void): Unsubscribe {
    return onSnapshot(query(this.collectionRef, where("campaignId", "==", campaignId)), (snapshot) => {
      listener(snapshot.docs.map((d) => d.data()));
    });
  }
}
