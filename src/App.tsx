/**
 * App shell. Hosts the interactive character builder, wired to an in-memory
 * repository so save/list/reload work end-to-end without a backend. Swapping in
 * `FirestoreCharacterRepository` (see `src/data`) is all it takes to persist to
 * Firestore instead.
 */

import { useMemo } from "react";
import { CharacterBuilder } from "./components/CharacterBuilder";
import { InMemoryCharacterRepository } from "./data/inMemoryCharacterRepository";
import "./App.css";

export function App() {
  // One repository instance for the app's lifetime.
  const repository = useMemo(() => new InMemoryCharacterRepository(), []);

  return (
    <main className="app">
      <header className="app__header">
        <h1 className="app__title">Cori</h1>
        <p className="app__tagline">Coriolis character builder</p>
      </header>
      <CharacterBuilder repository={repository} />
    </main>
  );
}

export default App;
