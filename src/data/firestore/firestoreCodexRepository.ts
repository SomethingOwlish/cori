/**
 * Firestore-хранилище пользовательских записей кодекса.
 *
 * Записи живут в одной коллекции (по умолчанию `codex`), по документу на запись,
 * с ключом-`id`. Кодекс общий для всех: любая добавленная ведущим или игроком
 * запись видна остальным участникам, поэтому хранится в Firestore, а не в
 * localStorage конкретного браузера. Чтение защитное — частично записанный или
 * вручную отредактированный документ всё равно даёт корректную `CodexEntry`.
 */

import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  type CollectionReference,
  type DocumentData,
  type Firestore,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

import {
  CODEX_CATEGORIES,
  type CodexCategory,
  type CodexEntry,
  type CodexStat,
  type TechLevel,
} from "../../domain/coriolis";
import type { CodexRepository } from "../codexRepository";
import { getFirestoreDb } from "./firebaseApp";

const DEFAULT_COLLECTION = "codex";
const TECH_LEVELS: readonly TechLevel[] = ["А", "С", "П", "З"];

function asCategory(value: unknown): CodexCategory {
  return CODEX_CATEGORIES.includes(value as CodexCategory) ? (value as CodexCategory) : "gear";
}

function asStats(value: unknown): CodexStat[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const stats = value
    .filter((s): s is { label: unknown; value: unknown } => typeof s === "object" && s !== null)
    .map((s) => ({ label: String(s.label ?? ""), value: String(s.value ?? "") }))
    .filter((s) => s.label || s.value);
  return stats.length ? stats : undefined;
}

function asStrings(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const arr = value.filter((s): s is string => typeof s === "string");
  return arr.length ? arr : undefined;
}

const codexConverter: FirestoreDataConverter<CodexEntry> = {
  toFirestore(entry: CodexEntry): DocumentData {
    // Firestore rejects `undefined`; drop absent optionals.
    const out: DocumentData = {
      category: entry.category,
      name: entry.name,
      summary: entry.summary,
      custom: true,
    };
    if (entry.group) out.group = entry.group;
    if (entry.stats?.length) out.stats = entry.stats;
    if (entry.tags?.length) out.tags = entry.tags;
    if (entry.tech) out.tech = entry.tech;
    if (entry.price) out.price = entry.price;
    if (entry.weight) out.weight = entry.weight;
    if (entry.licensed) out.licensed = true;
    return out;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): CodexEntry {
    const data = snapshot.data();
    const tech = TECH_LEVELS.includes(data.tech as TechLevel) ? (data.tech as TechLevel) : undefined;
    return {
      id: snapshot.id,
      category: asCategory(data.category),
      name: typeof data.name === "string" ? data.name : "",
      group: typeof data.group === "string" ? data.group : undefined,
      summary: typeof data.summary === "string" ? data.summary : "",
      stats: asStats(data.stats),
      tags: asStrings(data.tags),
      tech,
      price: typeof data.price === "string" ? data.price : undefined,
      weight: typeof data.weight === "string" ? data.weight : undefined,
      licensed: data.licensed === true || undefined,
      custom: true,
    };
  },
};

export class FirestoreCodexRepository implements CodexRepository {
  private readonly collectionRef: CollectionReference<CodexEntry>;

  constructor(db: Firestore = getFirestoreDb(), collectionPath: string = DEFAULT_COLLECTION) {
    this.collectionRef = collection(db, collectionPath).withConverter(codexConverter);
  }

  async list(): Promise<CodexEntry[]> {
    const snapshot = await getDocs(this.collectionRef);
    return snapshot.docs.map((d) => d.data());
  }

  async save(entry: CodexEntry): Promise<void> {
    await setDoc(doc(this.collectionRef, entry.id), entry);
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(this.collectionRef, id));
  }
}
