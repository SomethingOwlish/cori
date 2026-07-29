import type { FaceEntry } from "../domain/coriolis";
import { loadCollection, saveCollection } from "./localStorageStore";
import type { FacesRepository } from "./facesRepository";

const DEFAULT_KEY = "cori.faces";
const clone = <T,>(value: T): T =>
  typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value)) as T;

export class LocalStorageFacesRepository implements FacesRepository {
  constructor(private readonly key = DEFAULT_KEY) {}
  private read(): FaceEntry[] { return loadCollection<FaceEntry>(this.key); }
  async list(): Promise<FaceEntry[]> { return this.read().map(clone); }
  async save(entry: FaceEntry): Promise<void> {
    const all = this.read();
    const index = all.findIndex((item) => item.id === entry.id);
    if (index < 0) all.push(clone(entry)); else all[index] = clone(entry);
    saveCollection(this.key, all);
  }
  async delete(id: string): Promise<void> { saveCollection(this.key, this.read().filter((item) => item.id !== id)); }
}
