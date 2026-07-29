import { collection, deleteDoc, doc, getDocs, setDoc, type CollectionReference, type DocumentData, type Firestore, type FirestoreDataConverter, type QueryDocumentSnapshot } from "firebase/firestore";
import { FACE_TYPES, type FaceEntry, type FaceLocation, type FaceType } from "../../domain/coriolis";
import type { FacesRepository } from "../facesRepository";
import { getFirestoreDb } from "./firebaseApp";

const converter: FirestoreDataConverter<FaceEntry> = {
  toFirestore(entry): DocumentData {
    const out: DocumentData = { type: entry.type, name: entry.name, description: entry.description, hidden: entry.hidden };
    if (entry.masterDescription) out.masterDescription = entry.masterDescription;
    if (entry.imageUrl) out.imageUrl = entry.imageUrl;
    if (entry.statBlock) out.statBlock = entry.statBlock;
    if (entry.lastLocation) out.lastLocation = entry.lastLocation;
    return out;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): FaceEntry {
    const data = snapshot.data();
    const location = data.lastLocation && typeof data.lastLocation === "object" && typeof data.lastLocation.systemId === "string" && typeof data.lastLocation.placeId === "string"
      ? data.lastLocation as FaceLocation : undefined;
    return {
      id: snapshot.id,
      type: FACE_TYPES.includes(data.type as FaceType) ? data.type as FaceType : "person",
      name: typeof data.name === "string" ? data.name : "",
      description: typeof data.description === "string" ? data.description : "",
      masterDescription: typeof data.masterDescription === "string" ? data.masterDescription : undefined,
      imageUrl: typeof data.imageUrl === "string" ? data.imageUrl : undefined,
      statBlock: typeof data.statBlock === "string" ? data.statBlock : undefined,
      lastLocation: location,
      hidden: data.hidden !== false,
    };
  },
};

export class FirestoreFacesRepository implements FacesRepository {
  private readonly ref: CollectionReference<FaceEntry>;
  constructor(db: Firestore = getFirestoreDb(), path = "faces") { this.ref = collection(db, path).withConverter(converter); }
  async list(): Promise<FaceEntry[]> { return (await getDocs(this.ref)).docs.map((item) => item.data()); }
  async save(entry: FaceEntry): Promise<void> { await setDoc(doc(this.ref, entry.id), entry); }
  async delete(id: string): Promise<void> { await deleteDoc(doc(this.ref, id)); }
}
