/**
 * PlayerHome — вход игрока.
 *
 * Игрок присоединяется к кампании по коду ведущего. Выбрав кампанию:
 *   - если герой уже создан — открывается его КАРТОЧКА (основной экран игрока),
 *     где он может править своё «ровно как прокачку»: навыки, бирры, внешность,
 *     взаимоотношения;
 *   - если героя ещё нет — открывается мастер создания (CharacterBuilder),
 *     после сохранения игрок попадает на карточку.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CampaignRepository, CharacterRepository, ShipRepository } from "../../data";
import { addPlayer, hasPlayer, type Campaign } from "../../domain/campaign";
import { assessShip, type Character } from "../../domain/coriolis";
import type { Session } from "../../session";
import { CharacterBuilder } from "../CharacterBuilder";
import { PlayerCard } from "../PlayerCard";
import { Button, Card, Input } from "../../design-system";
import "./PlayerHome.css";

const money = (n: number) => new Intl.NumberFormat("ru-RU").format(n);

export interface PlayerHomeProps {
  session: Session;
  campaigns: CampaignRepository;
  characters: CharacterRepository;
  ships: ShipRepository;
  onOpenShip: (campaignId: string) => void;
  onSignOut: () => void;
  /**
   * С каким экраном открыться. `"card"` (по «Карточка персонажа» из меню) сразу
   * ныряет в последнюю кампанию игрока и открывает его карточку; `"campaigns"`
   * (по умолчанию) показывает список кампаний.
   */
  initialView?: "campaigns" | "card";
}

export function PlayerHome({
  session,
  campaigns,
  characters,
  ships,
  onOpenShip,
  onSignOut,
  initialView = "campaigns",
}: PlayerHomeProps) {
  const [all, setAll] = useState<Campaign[]>([]);
  const [code, setCode] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);
  const [myChar, setMyChar] = useState<Character | null>(null);
  const [charLoaded, setCharLoaded] = useState(false);
  const [shipDebt, setShipDebt] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    setAll(await campaigns.list());
  }, [campaigns]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const mine = useMemo(
    () => all.filter((c) => hasPlayer(c, session.name)).sort((a, b) => b.createdAt - a.createdAt),
    [all, session.name],
  );

  // «Карточка персонажа» из меню: как только загрузился список кампаний, ныряем
  // в самую свежую кампанию игрока и открываем его карточку. Срабатывает один
  // раз за монтирование — дальше игрок волен уйти в список сам.
  const [autoOpened, setAutoOpened] = useState(false);
  useEffect(() => {
    if (initialView !== "card" || autoOpened || activeCampaignId) return;
    if (mine.length === 0) return;
    setActiveCampaignId(mine[0].id);
    setAutoOpened(true);
  }, [initialView, autoOpened, activeCampaignId, mine]);

  const activeCampaign = activeCampaignId ? (all.find((c) => c.id === activeCampaignId) ?? null) : null;

  // Загружаем героя игрока в выбранной кампании.
  const loadMyChar = useCallback(
    async (campaignId: string) => {
      setCharLoaded(false);
      const list = await characters.list();
      const found =
        list.find(
          (c) => c.campaignId === campaignId && (c.playerName ?? "").toLowerCase() === session.name.toLowerCase(),
        ) ?? null;
      setMyChar(found);
      setCharLoaded(true);
    },
    [characters, session.name],
  );

  useEffect(() => {
    if (activeCampaignId) void loadMyChar(activeCampaignId);
    else {
      setMyChar(null);
      setCharLoaded(false);
    }
  }, [activeCampaignId, loadMyChar]);

  // Load the active ship's debt for the open campaign.
  useEffect(() => {
    if (!activeCampaignId) {
      setShipDebt(null);
      return;
    }
    let cancelled = false;
    void ships.listByCampaign(activeCampaignId).then((list) => {
      if (cancelled) return;
      const active = list.find((s) => !s.archived);
      setShipDebt(active ? assessShip(active).debt : null);
    });
    return () => {
      cancelled = true;
    };
  }, [activeCampaignId, ships]);

  const handleJoin = async () => {
    const entered = code.trim().toUpperCase();
    if (!entered) return;
    setJoinError(null);

    const list = await campaigns.list();
    const match = list.find((c) => c.joinCode.toUpperCase() === entered);
    if (!match) {
      setJoinError("Кампания с таким кодом не найдена.");
      return;
    }
    const updated = addPlayer(match, session.name);
    if (updated !== match) await campaigns.save(updated);
    setCode("");
    await refresh();
    setActiveCampaignId(match.id);
  };

  // ── Активная кампания: карточка или билдер ───────────────────────────────
  if (activeCampaign) {
    const back = (
      <div className="ph__crumbs">
        <Button variant="ghost" size="sm" onClick={() => setActiveCampaignId(null)}>
          ← К кампаниям
        </Button>
        <span className="ph__crumb-name">{activeCampaign.name}</span>
        {shipDebt !== null && <span className="ph__crumb-debt">Долг: {money(shipDebt)} б.</span>}
        <Button variant="ghost" size="sm" onClick={() => onOpenShip(activeCampaign.id)}>
          🚀 Корабль
        </Button>
      </div>
    );

    if (!charLoaded) {
      return (
        <div className="ph">
          {back}
          <p className="ph__empty">Загрузка героя…</p>
        </div>
      );
    }

    if (myChar) {
      return (
        <div className="ph">
          {back}
          <PlayerCard
            character={myChar}
            editMode="self"
            onChange={(next) => {
              setMyChar(next);
              void characters.save(next);
            }}
          />
        </div>
      );
    }

    return (
      <div className="ph">
        {back}
        <CharacterBuilder
          repository={characters}
          campaignId={activeCampaign.id}
          defaultPlayerName={session.name}
          onBack={() => setActiveCampaignId(null)}
          onSaved={(c) => setMyChar(c)}
        />
      </div>
    );
  }

  // ── Список кампаний ──────────────────────────────────────────────────────
  return (
    <div className="ph">
      <header className="ph__head">
        <div>
          <h2 className="ph__title crl-title">Твои кампании</h2>
          <p className="ph__welcome">С возвращением, {session.name}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onSignOut}>
          Выйти
        </Button>
      </header>

      <Card variant="gilt" eyebrow="Портал" title="Присоединиться к кампании" style={{ maxWidth: 620 }}>
        <form
          className="ph__join-form"
          onSubmit={(e) => {
            e.preventDefault();
            void handleJoin();
          }}
        >
          <Input
            value={code}
            placeholder="Код входа, напр. K7QP2M"
            onChange={(e) => {
              setCode(e.target.value);
              setJoinError(null);
            }}
            aria-invalid={joinError !== null}
            error={joinError ?? undefined}
            wrapStyle={{ flex: 1 }}
          />
          <Button type="submit" disabled={code.trim() === ""}>
            Присоединиться
          </Button>
        </form>
      </Card>

      <section aria-label="Мои кампании">
        <h3 className="ph__subhead crl-eyebrow">Мои кампании</h3>
        {mine.length === 0 ? (
          <p className="ph__empty">Ты ещё не в одной кампании. Попроси у ведущего код и введи его выше.</p>
        ) : (
          <ul className="ph__list">
            {mine.map((c) => (
              <li key={c.id}>
                <Card interactive onClick={() => setActiveCampaignId(c.id)} style={{ cursor: "pointer" }}>
                  <span className="ph__item-name">{c.name}</span>
                  <span className="ph__item-meta">Ведущий: {c.gmName}</span>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default PlayerHome;
