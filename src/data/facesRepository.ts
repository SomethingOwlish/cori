import type { FaceEntry } from "../domain/coriolis";

export interface FacesRepository {
  list(): Promise<FaceEntry[]>;
  save(entry: FaceEntry): Promise<void>;
  delete(id: string): Promise<void>;
}
