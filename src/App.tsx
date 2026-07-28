/**
 * Оболочка приложения «Кориолис. Третий Горизонт».
 *
 * Две вкладки:
 *   • «Мастер создания» — пошаговый мастер сборки героя (см. CharacterBuilder).
 *   • «Карточка» — карточка героя для ОТОБРАЖЕНИЯ. По умолчанию доступна только
 *     для чтения. Менять показатели можно лишь двумя способами:
 *       — включив «Режим мастера» (правка трекеров: здоровье, рассудок,
 *         радиация, репутация, опыт);
 *       — включив «Прокачку» — тогда за 5 пунктов опыта можно поднимать навыки
 *         прямо на карточке (кнопки «+»).
 *
 * Хранение — через внедрённый `CharacterRepository` (в памяти; замена на
 * `FirestoreCharacterRepository` не требует правок UI).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { CharacterBuilder } from "./components/CharacterBuilder";
import { PlayerCard } from "./components/PlayerCard";
import { InMemoryCharacterRepository } from "./data/inMemoryCharacterRepository";
import {
  generateCharacter,
  maxHitPoints,
  maxMindPoints,
  raiseSkillWithExperience,
  EXPERIENCE_PER_ADVANCE,
  type Character,
  type SkillKey,
} from "./domain/coriolis";
import "./App.css";

type Tab = "build" | "sheet";

export function App() {
  const repository = useMemo(() => new InMemoryCharacterRepository(), []);
  const [tab, setTab] = useState<Tab>("build");

  // Карточка: собственное состояние просмотра.
  const [sheet, setSheet] = useState<Character>(() =>
    generateCharacter({ id: "demo", seed: 7 }),
  );
  const [gmMode, setGmMode] = useState(false);
  const [levelMode, setLevelMode] = useState(false);
  const [saved, setSaved] = useState<Character[]>([]);

  const refresh = useCallback(async () => {
    try {
      setSaved(await repository.list());
    } catch {
      /* необязательно */
    }
  }, [repository]);

  useEffect(() => {
    void refresh();
  }, [refresh, tab]);

  const patchSheet = (patch: Partial<Character>) => setSheet((c) => ({ ...c, ...patch }));

  const raiseSkill = (key: SkillKey) => setSheet((c) => raiseSkillWithExperience(c, key));

  const hpMax = maxHitPoints(sheet.attributes);
  const mpMax = maxMindPoints(sheet.attributes);

  return (
    <main className="app">
      <header className="app__header">
        <h1 className="app__title">Кориолис. Третий Горизонт</h1>
        <p className="app__tagline">Мастер создания персонажа и карточка героя</p>
        <nav className="app__tabs">
          <button
            type="button"
            className={tab === "build" ? "app__tab app__tab--active" : "app__tab"}
            onClick={() => setTab("build")}
          >
            Мастер создания
          </button>
          <button
            type="button"
            className={tab === "sheet" ? "app__tab app__tab--active" : "app__tab"}
            onClick={() => setTab("sheet")}
          >
            Карточка
          </button>
        </nav>
      </header>

      {tab === "build" ? (
        <CharacterBuilder repository={repository} />
      ) : (
        <div className="app__sheet">
          <div className="app__sheet-controls">
            <label className="app__pick">
              Персонаж:{" "}
              <select
                value={sheet.id}
                onChange={(e) => {
                  const found = saved.find((c) => c.id === e.target.value);
                  if (found) setSheet(found);
                }}
              >
                <option value={sheet.id}>{sheet.name || "Демо-герой"}</option>
                {saved
                  .filter((c) => c.id !== sheet.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name || "Без имени"}
                    </option>
                  ))}
              </select>
            </label>

            <label className="app__toggle">
              <input type="checkbox" checked={gmMode} onChange={(e) => setGmMode(e.target.checked)} />{" "}
              Режим мастера
            </label>
            <label className="app__toggle">
              <input type="checkbox" checked={levelMode} onChange={(e) => setLevelMode(e.target.checked)} />{" "}
              Прокачка
            </label>
            <button type="button" onClick={() => repository.save(sheet).then(refresh)}>
              💾 Сохранить
            </button>
          </div>

          {!gmMode && !levelMode && (
            <p className="app__readonly">
              🔒 Карточка только для чтения. Включи «Режим мастера», чтобы править трекеры, или
              «Прокачку», чтобы поднимать навыки за опыт.
            </p>
          )}

          {gmMode && (
            <div className="app__gm">
              <span className="app__gm-title">Режим мастера — правка трекеров:</span>
              <Tracker label="Здоровье" value={sheet.hitPointsCurrent} max={hpMax} onChange={(v) => patchSheet({ hitPointsCurrent: v })} min={0} />
              <Tracker label="Рассудок" value={sheet.mindPointsCurrent} max={mpMax} onChange={(v) => patchSheet({ mindPointsCurrent: v })} min={0} />
              <Tracker label="Радиация" value={sheet.radiation} max={99} onChange={(v) => patchSheet({ radiation: v })} min={0} />
              <Tracker label="Репутация" value={sheet.reputation} max={99} onChange={(v) => patchSheet({ reputation: v })} min={0} />
              <Tracker label="Опыт" value={sheet.experience} max={99} onChange={(v) => patchSheet({ experience: v })} min={0} />
              <button type="button" onClick={() => patchSheet({ experience: sheet.experience + EXPERIENCE_PER_ADVANCE })}>
                +5 опыта
              </button>
            </div>
          )}

          <PlayerCard character={sheet} canLevelUp={levelMode} onRaiseSkill={raiseSkill} />
        </div>
      )}
    </main>
  );
}

function Tracker({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  return (
    <span className="app__tracker">
      {label}
      <button type="button" onClick={() => onChange(clamp(value - 1))}>
        −
      </button>
      <b>{value}</b>
      <button type="button" onClick={() => onChange(clamp(value + 1))}>
        +
      </button>
    </span>
  );
}

export default App;
