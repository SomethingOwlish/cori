/**
 * ShipPage — страница корабля кампании.
 *
 * Показывает активный корабль (`!archived`) на просмотр сверху, архивные — ниже
 * в сворачиваемых карточках. Если активного корабля нет — приглашение собрать
 * его (доступно любому участнику). Архивировать активный корабль может только
 * мастер. Данные грузятся из `ShipRepository` с живой подпиской, поиск в
 * конструкторе идёт по записям кодекса категории «Корабль» (встроенным и
 * пользовательским).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CodexRepository, ShipRepository } from "../../data";
import { assessShip, BUILTIN_CODEX, type CodexEntry, type Ship } from "../../domain/coriolis";
import { Badge, Button, Card, Select } from "../../design-system";
import { ShipBuilder } from "./ShipBuilder";
import { ShipCard } from "./ShipCard";
import "./Ship.css";

export interface ShipPageProps {
  repository: ShipRepository;
  codex: CodexRepository;
  /** Кампания корабля. `null`, если у пользователя нет кампаний. */
  campaignId: string | null;
  campaignName?: string;
  /** Для переключателя кампаний (глобальное меню). */
  campaignOptions?: { id: string; name: string }[];
  onSelectCampaign?: (id: string) => void;
  role: "gm" | "player";
  currentUserName: string;
  onBack?: () => void;
}

const money = (n: number) => new Intl.NumberFormat("ru-RU").format(n);

export function ShipPage({
  repository,
  codex,
  campaignId,
  campaignName,
  campaignOptions,
  onSelectCampaign,
  role,
  currentUserName,
  onBack,
}: ShipPageProps) {
  const [ships, setShips] = useState<Ship[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [building, setBuilding] = useState(false);
  const [customCodex, setCustomCodex] = useState<CodexEntry[]>([]);
  const isMaster = role === "gm";

  const [loadError, setLoadError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!campaignId) {
      setShips([]);
      setLoaded(true);
      return;
    }
    // Always flip `loaded` — otherwise a rejected read (e.g. Firestore rules)
    // would leave the page stuck on «Загрузка корабля…» forever.
    try {
      setShips(await repository.listByCampaign(campaignId));
      setLoadError(null);
    } catch (error) {
      console.error("Не удалось загрузить корабли кампании.", error);
      setLoadError("Не удалось загрузить корабли. Проверьте доступ к базе и обновите страницу.");
    } finally {
      setLoaded(true);
    }
  }, [repository, campaignId]);

  useEffect(() => {
    void refresh();
    void codex.list().then(setCustomCodex).catch(() => setCustomCodex([]));
    if (!campaignId) return;
    let unsub = () => {};
    try {
      unsub = repository.subscribe(campaignId, (next) => setShips(next));
    } catch (error) {
      console.error("Не удалось подписаться на корабли кампании.", error);
    }
    return () => unsub();
  }, [refresh, codex, repository, campaignId]);

  const shipCodex = useMemo<CodexEntry[]>(
    () => [
      ...BUILTIN_CODEX.filter((e) => e.category === "ship"),
      ...customCodex.filter((e) => e.category === "ship"),
    ],
    [customCodex],
  );

  const active = useMemo(() => ships.find((s) => !s.archived) ?? null, [ships]);
  const archived = useMemo(
    () => ships.filter((s) => s.archived).sort((x, y) => (y.archivedAt ?? 0) - (x.archivedAt ?? 0)),
    [ships],
  );

  const handleArchive = async (ship: Ship) => {
    await repository.save({ ...ship, archived: true, archivedAt: Date.now() });
    await refresh();
  };

  const handleDelete = async (ship: Ship) => {
    await repository.delete(ship.id);
    await refresh();
  };

  const header = (
    <header className="shp__head">
      <div>
        <span className="crl-eyebrow">Капитанский журнал</span>
        <h2 className="shp__title crl-title">Корабль</h2>
        <p className="shp__sub crl-flavor">
          {campaignName ? `Кампания: ${campaignName}` : "Корабль команды"}
        </p>
      </div>
      {campaignOptions && campaignOptions.length > 1 && onSelectCampaign && (
        <Select
          aria-label="Кампания"
          value={campaignId ?? ""}
          onChange={(e) => onSelectCampaign(e.target.value)}
          wrapStyle={{ minWidth: 200 }}
        >
          {campaignOptions.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
      )}
      {onBack && (
        <Button variant="ghost" size="sm" onClick={onBack}>← Назад</Button>
      )}
    </header>
  );

  if (!campaignId) {
    return (
      <div className="shp">
        {header}
        <p className="shp__empty">Сначала присоединитесь к кампании или создайте её — корабль привязан к кампании.</p>
      </div>
    );
  }

  if (building) {
    return (
      <div className="shp">
        {header}
        <ShipBuilder
          repository={repository}
          campaignId={campaignId}
          shipCodex={shipCodex}
          createdBy={currentUserName}
          onBack={() => setBuilding(false)}
          onSaved={() => {
            setBuilding(false);
            void refresh();
          }}
        />
      </div>
    );
  }

  return (
    <div className="shp">
      {header}

      {!loaded ? (
        <p className="shp__empty">Загрузка корабля…</p>
      ) : loadError ? (
        <p className="shp__empty">{loadError}</p>
      ) : active ? (
        <section className="shp__active">
          <ShipCard ship={active} />
          {isMaster && (
            <div className="shp__actions">
              <Button variant="ghost" size="sm" onClick={() => handleArchive(active)}>
                В архив
              </Button>
            </div>
          )}
        </section>
      ) : (
        <Card variant="gilt" className="shp__invite">
          <h3 className="crl-title">У команды пока нет корабля</h3>
          <p className="crl-flavor">
            Соберите корабль по правилам книги: класс, верфь, модули, усовершенствования и орудия.
          </p>
          <Button onClick={() => setBuilding(true)} iconLeft="🚀">Создать корабль</Button>
        </Card>
      )}

      {active && isMaster && (
        <p className="shp__note">
          Чтобы собрать новый корабль, отправьте текущий в архив.
        </p>
      )}

      {archived.length > 0 && (
        <section className="shp__archive">
          <h3 className="shp__archive-h crl-eyebrow">Архив кораблей ({archived.length})</h3>
          {archived.map((ship) => {
            const a = assessShip(ship);
            return (
              <details key={ship.id} className="shp__arch-item">
                <summary className="shp__arch-summary">
                  <span className="shp__arch-name">{ship.name || "Без названия"}</span>
                  <span className="shp__arch-meta">
                    {ship.classId && `${ship.classId} класс · `}долг {money(a.debt)} б.
                  </span>
                  <Badge tone="neutral">в архиве</Badge>
                </summary>
                <div className="shp__arch-body">
                  <ShipCard ship={ship} />
                  {isMaster && (
                    <div className="shp__actions">
                      <button type="button" className="shp__delete" onClick={() => handleDelete(ship)}>
                        Удалить из архива
                      </button>
                    </div>
                  )}
                </div>
              </details>
            );
          })}
        </section>
      )}
    </div>
  );
}

export default ShipPage;
