/**
 * «Третий Горизонт» — the atlas page.
 *
 * Loads the shared atlas state from the repository, renders the portal graph,
 * and opens a system modal on node click. All edits (master's places + «вы
 * здесь», players' tags) go through the pure `thirdHorizon` state helpers and are
 * persisted; a live subscription keeps every viewer in sync.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ThirdHorizonRepository } from "../../data";
import {
  SYSTEM_BY_ID,
  THIRD_HORIZON_SYSTEMS,
  addCustomPlace,
  emptyState,
  makeCustomPlaceId,
  removeCustomPlace,
  setCurrentSystem,
  setPlaceDetails,
  setPlaceHidden,
  setPlaceTags,
  visiblePlaces,
  type StarSystem,
  type SystemPlace,
  type ThirdHorizonState,
} from "../../domain/thirdHorizon";
import { SystemGraph } from "./SystemGraph";
import { SystemModal, type AtlasEditMode, type NewPlaceDraft } from "./SystemModal";
import "./ThirdHorizon.css";

export interface ThirdHorizonPageProps {
  repository: ThirdHorizonRepository;
  /** GM edits everything; players edit only tags. */
  editMode: AtlasEditMode;
}

/** Random suffix for custom place ids (randomness lives here, not in the pure domain). */
function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2, 10);
}

export function ThirdHorizonPage({ repository, editMode }: ThirdHorizonPageProps) {
  const isMaster = editMode === "master";
  const [state, setState] = useState<ThirdHorizonState>(emptyState);
  const [loaded, setLoaded] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Guards the subscription from echoing our own just-saved write back over local state.
  const savingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    repository
      .load()
      .then((loadedState) => {
        if (!cancelled && loadedState) setState(loadedState);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    const unsubscribe = repository.subscribe((next) => {
      if (savingRef.current) return;
      if (next) setState(next);
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [repository]);

  // Applies a pure state transition and persists it. Optimistic: local state
  // updates immediately; the write is fire-and-forget with the echo guard.
  const mutate = useCallback(
    (next: ThirdHorizonState) => {
      setState(next);
      savingRef.current = true;
      void repository.save(next).finally(() => {
        savingRef.current = false;
      });
    },
    [repository],
  );

  const selected: StarSystem | null = selectedId ? SYSTEM_BY_ID[selectedId] ?? null : null;

  // Systems that have at least one place the current viewer can see (for the node marker).
  const systemsWithPlaces = useMemo(() => {
    const set = new Set<string>();
    for (const s of THIRD_HORIZON_SYSTEMS) {
      if (visiblePlaces(s, state, isMaster).length > 0) set.add(s.id);
    }
    return set;
  }, [state, isMaster]);

  const modalPlaces: SystemPlace[] = selected ? visiblePlaces(selected, state, isMaster) : [];

  const addPlace = (system: StarSystem, draft: NewPlaceDraft) => {
    const place: SystemPlace = {
      id: makeCustomPlaceId(system.id, randomId()),
      name: draft.name,
      owner: draft.owner,
      description: draft.description,
      tags: [],
      hidden: false,
    };
    mutate(addCustomPlace(state, system.id, place));
  };

  return (
    <section className="th-page">
      <header className="th-page__head">
        <div>
          <p className="crl-eyebrow">الأفق الثالث</p>
          <h2 className="th-page__title crl-title">Третий Горизонт</h2>
          <p className="th-page__lede crl-flavor">
            Сеть порталов Третьего Горизонта. Нажмите на систему, чтобы открыть её досье.
            {isMaster ? " Ведущий отмечает «вы здесь» и ведёт список мест." : " Игрок может добавлять теги к местам."}
          </p>
        </div>
      </header>

      {!loaded ? (
        <p className="th-page__loading">Загрузка карты…</p>
      ) : (
        <SystemGraph
          currentSystemId={state.currentSystemId}
          systemsWithPlaces={systemsWithPlaces}
          onSelect={setSelectedId}
        />
      )}

      {selected ? (
        <SystemModal
          system={selected}
          places={modalPlaces}
          editMode={editMode}
          isHere={state.currentSystemId === selected.id}
          onClose={() => setSelectedId(null)}
          onToggleHere={() => mutate(setCurrentSystem(state, selected.id))}
          onSetTags={(placeId, tags) => mutate(setPlaceTags(state, selected.id, placeId, tags))}
          onSetHidden={(placeId, hidden) => mutate(setPlaceHidden(state, selected.id, placeId, hidden))}
          onSetDetails={(placeId, details) => mutate(setPlaceDetails(state, selected.id, placeId, details))}
          onAddPlace={(draft) => addPlace(selected, draft)}
          onRemovePlace={(placeId) => mutate(removeCustomPlace(state, selected.id, placeId))}
        />
      ) : null}
    </section>
  );
}

export default ThirdHorizonPage;
