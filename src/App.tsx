/**
 * Demo shell. Generates a sample character and renders its player card. This
 * is a scaffold to exercise the domain + card structure — the real app UI will
 * grow from here.
 */

import { useMemo, useState } from "react";
import { PlayerCard } from "./components/PlayerCard";
import { assessCharacter, generateCharacter } from "./domain/coriolis";

export function App() {
  const [seed, setSeed] = useState(1);

  const character = useMemo(
    () => generateCharacter({ id: `demo-${seed}`, seed, name: "Generated Explorer" }),
    [seed],
  );
  const assessment = useMemo(() => assessCharacter(character), [character]);

  return (
    <main style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1rem", alignItems: "flex-start" }}>
      <h1 style={{ margin: 0 }}>Cori — Character Generator</h1>
      <button onClick={() => setSeed((s) => s + 1)}>Reroll (seed {seed})</button>

      <PlayerCard character={character} />

      <section aria-label="Assessment">
        <p>
          Build is <strong>{assessment.valid ? "valid" : "invalid"}</strong> — attributes{" "}
          {assessment.attributePointsSpent}/{assessment.attributePointsAllowed}, skills{" "}
          {assessment.skillPointsSpent}/{assessment.skillPointsAllowed}.
        </p>
        {assessment.issues.length > 0 && (
          <ul>
            {assessment.issues.map((issue, i) => (
              <li key={i}>
                [{issue.severity}] {issue.area}: {issue.message}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

export default App;
