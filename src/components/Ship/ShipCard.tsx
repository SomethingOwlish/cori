/**
 * ShipCard — карточка корабля на просмотр (по бланку ST3098).
 *
 * Read-only: показывает класс/тип, верфь, проблему, долг, «Данные»
 * (манёвренность/заметность/скорость/броня), пункты энергии и прочности, модули
 * (с пометкой «не в строю»), усовершенствования, орудия и экипаж. Расчёт
 * характеристик, цены и долга берётся из `assessShip`.
 */

import { assessShip, SHIPYARDS, type Ship } from "../../domain/coriolis";
import { Badge, Card, StatBlock, Tag } from "../../design-system";

export interface ShipCardProps {
  ship: Ship;
}

const sign = (n: number) => (n > 0 ? `+${n}` : String(n));
const money = (n: number) => new Intl.NumberFormat("ru-RU").format(n);

const CREW_LABELS: [keyof Ship["crew"], string][] = [
  ["captain", "Капитан"],
  ["pilot", "Пилот"],
  ["sensorOp", "Штурман-оператор"],
  ["gunner", "Бортстрелок"],
  ["engineer", "Бортинженер"],
];

export function ShipCard({ ship }: ShipCardProps) {
  const a = assessShip(ship);
  const shipyard = ship.shipyardId ? SHIPYARDS.find((y) => y.codexId === ship.shipyardId) : undefined;
  const classAndType = [ship.classId && `${ship.classId} класс`, ship.typeName].filter(Boolean).join(" · ");
  const crewShown = CREW_LABELS.filter(([k]) => ship.crew?.[k]);

  return (
    <Card variant="gilt" className="shp-card">
      <header className="shp-card__head">
        <div>
          <span className="crl-eyebrow">Корабль</span>
          <h3 className="shp-card__name crl-title">{ship.name || "Без названия"}</h3>
          <p className="shp-card__meta">
            {classAndType || "Класс не выбран"}
            {shipyard ? ` · ${shipyard.name}` : ""}
          </p>
        </div>
        <div className="shp-card__debt" title="Долг команды">
          <span className="shp-card__debt-label">Долг</span>
          <span className="shp-card__debt-value">{money(a.debt)} б.</span>
        </div>
      </header>

      {ship.problem && (
        <p className="shp-card__problem">
          <Badge tone="warning">Проблема</Badge> {ship.problem.name}
        </p>
      )}

      <div className="shp-card__stats">
        <StatBlock label="Манёвр." value={sign(a.stats.maneuver)} />
        <StatBlock label="Заметность" value={sign(a.stats.signature)} />
        <StatBlock label="Скорость" value={a.stats.speed} />
        <StatBlock label="Броня" value={a.stats.armor} />
        <StatBlock label="Энергия" value={a.stats.energy} tone="astral" />
        <StatBlock label="Прочность" value={a.stats.hull} tone="astral" />
      </div>

      <div className="shp-card__cols">
        <section className="shp-card__section">
          <h4 className="shp-card__h">
            Модули <span className="shp-card__slots">{a.slotsUsed} / {a.slotsTotal} отсеков</span>
          </h4>
          <ul className="shp-card__list">
            {ship.modules.map((m, i) => (
              <li key={i} className={m.outOfOrder ? "shp-card__li--broken" : ""}>
                <span>{m.name}</span>
                {m.builtIn && <Tag>встроен</Tag>}
                {m.outOfOrder && <Badge tone="danger">не в строю</Badge>}
              </li>
            ))}
            {ship.modules.length === 0 && <li className="shp-card__empty">—</li>}
          </ul>
        </section>

        <section className="shp-card__section">
          <h4 className="shp-card__h">Усовершенствования</h4>
          <ul className="shp-card__list">
            {ship.upgrades.map((u, i) => (
              <li key={i}>
                <span>{u.name}</span>
                {u.mod && <Tag>{u.mod}</Tag>}
              </li>
            ))}
            {ship.upgrades.length === 0 && <li className="shp-card__empty">—</li>}
          </ul>
        </section>
      </div>

      {ship.weapons.length > 0 && (
        <section className="shp-card__section">
          <h4 className="shp-card__h">Оружие</h4>
          <div className="shp-card__wtable">
            <div className="shp-card__wrow shp-card__wrow--head">
              <span>Название</span><span>Мод.</span><span>Урон</span><span>Порог</span><span>Дистанция</span>
            </div>
            {ship.weapons.map((w, i) => (
              <div key={i} className={`shp-card__wrow${w.outOfOrder ? " shp-card__li--broken" : ""}`}>
                <span>{w.name}{w.outOfOrder ? " (не в строю)" : ""}</span>
                <span>{w.bonus}</span><span>{w.damage}</span><span>{w.crit}</span><span>{w.range}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {crewShown.length > 0 && (
        <section className="shp-card__section">
          <h4 className="shp-card__h">Экипаж</h4>
          <div className="shp-card__crew">
            {crewShown.map(([k, label]) => (
              <div key={k} className="shp-card__crew-item">
                <span className="shp-card__crew-role">{label}</span>
                <span className="shp-card__crew-name">{ship.crew[k]}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {(ship.criticalDamage || ship.cargo || ship.notes) && (
        <section className="shp-card__section shp-card__notes">
          {ship.criticalDamage && <p><b>Критические повреждения:</b> {ship.criticalDamage}</p>}
          {ship.cargo && <p><b>Груз:</b> {ship.cargo}</p>}
          {ship.notes && <p><b>Заметки:</b> {ship.notes}</p>}
        </section>
      )}
    </Card>
  );
}

export default ShipCard;
