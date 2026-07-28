/**
 * localStorage-хранилище пользовательских записей кодекса.
 *
 * Хранит записи одним JSON-массивом под единым ключом, повторяя приём
 * campaign/character-репозиториев. Глубокое копирование на чтении/записи
 * защищает внутреннее состояние от внешних мутаций.
 */

import type { CodexEntry } from "../domain/coriolis";
import type { CodexRepository } from "./codexRepository";
import { loadCollection, saveCollection } from "./localStorageStore";

const DEFAULT_KEY = "cori.codex";

function clone<T>(value: T): T {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}

export class LocalStorageCodexRepository implements CodexRepository {
  constructor(private readonly key: string = DEFAULT_KEY) {}

  private read(): CodexEntry[] {
    return loadCollection<CodexEntry>(this.key);
  }

  async list(): Promise<CodexEntry[]> {
    return this.read().map(clone);
  }

  async save(entry: CodexEntry): Promise<void> {
    const all = this.read();
    const index = all.findIndex((e) => e.id === entry.id);
    if (index >= 0) all[index] = clone(entry);
    else all.push(clone(entry));
    saveCollection(this.key, all);
  }

  async delete(id: string): Promise<void> {
    saveCollection(
      this.key,
      this.read().filter((e) => e.id !== id),
    );
  }
}
