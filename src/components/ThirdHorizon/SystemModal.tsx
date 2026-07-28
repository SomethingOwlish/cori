/**
 * System detail modal — everything about one star system.
 *
 * Top: system lore (число светил, число планет with the map's notation, export/
 * import). The master can toggle «вы здесь» here. Bottom: the list of places.
 * Players may edit only a place's tags; the master adds, edits, hides and
 * removes places. Hidden places are never shown to players.
 */

import { useState } from "react";
import {
  PLANET_LEGEND,
  type StarSystem,
  type SystemPlace,
} from "../../domain/thirdHorizon";
import { Badge, Button, Dialog, Input, Tag, Textarea } from "../../design-system";

export type AtlasEditMode = "master" | "player";

export interface NewPlaceDraft {
  name: string;
  owner: string;
  description: string;
}

export interface SystemModalProps {
  system: StarSystem;
  /** Places already filtered to what this viewer may see. */
  places: SystemPlace[];
  editMode: AtlasEditMode;
  isHere: boolean;
  onClose: () => void;
  onToggleHere: () => void;
  onSetTags: (placeId: string, tags: string[]) => void;
  onSetHidden: (placeId: string, hidden: boolean) => void;
  onSetDetails: (placeId: string, details: { owner?: string; description?: string }) => void;
  onAddPlace: (draft: NewPlaceDraft) => void;
  onRemovePlace: (placeId: string) => void;
}

const STATUS_LABEL: Record<StarSystem["status"], string> = {
  faction: "Владения фракции",
  civilized: "Цивилизованная система",
  frontier: "Пограничная система",
  undeveloped: "Неосвоенная система",
};

export function SystemModal(props: SystemModalProps) {
  const { system, places, editMode, isHere } = props;
  const isMaster = editMode === "master";
  const [adding, setAdding] = useState(false);

  return (
    <Dialog
      open
      onClose={props.onClose}
      width={660}
      eyebrow={
        <span className="th-modal__eyebrow">
          {system.region}
          {system.spaceport ? " · крупный космопорт" : ""}
        </span>
      }
      title={
        <span className="th-modal__title-row">
          {system.name}
          {isHere ? <Badge tone="gold" dot>вы здесь</Badge> : null}
        </span>
      }
      footer={<Button variant="secondary" onClick={props.onClose}>Закрыть</Button>}
    >
      <div className="th-modal">
        {/* System facts */}
        <div className="th-modal__facts">
          <div className="th-fact">
            <span className="th-fact__label">Светил</span>
            <span className="th-fact__value">{system.stars.length}</span>
            <span className="th-fact__sub">{system.stars.join(" · ")}</span>
          </div>
          <div className="th-fact">
            <span className="th-fact__label">Планеты</span>
            <span className="th-fact__value">{system.planets}</span>
            <span className="th-fact__sub">{PLANET_LEGEND}</span>
          </div>
          <div className="th-fact">
            <span className="th-fact__label">Статус</span>
            <span className="th-fact__value th-fact__value--sm">{STATUS_LABEL[system.status]}</span>
          </div>
        </div>

        {system.export || system.import ? (
          <div className="th-modal__trade">
            {system.export ? <p><strong>Экспорт:</strong> {system.export}.</p> : null}
            {system.import ? <p><strong>Импорт:</strong> {system.import}.</p> : null}
          </div>
        ) : null}

        {isMaster ? (
          <Button
            variant={isHere ? "secondary" : "ghost"}
            size="sm"
            onClick={props.onToggleHere}
            style={{ alignSelf: "flex-start" }}
          >
            {isHere ? "Снять «вы здесь»" : "Отметить «вы здесь»"}
          </Button>
        ) : null}

        {/* Places */}
        <div className="th-modal__places-head">
          <h3 className="crl-eyebrow">Места · {places.length}</h3>
          {isMaster ? (
            <Button size="sm" variant="ghost" onClick={() => setAdding((v) => !v)}>
              {adding ? "Отмена" : "+ Добавить место"}
            </Button>
          ) : null}
        </div>

        {isMaster && adding ? (
          <AddPlaceForm
            onAdd={(draft) => {
              props.onAddPlace(draft);
              setAdding(false);
            }}
          />
        ) : null}

        {places.length === 0 ? (
          <p className="th-modal__empty">Мест пока нет.</p>
        ) : (
          <ul className="th-places">
            {places.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                isMaster={isMaster}
                onSetTags={(tags) => props.onSetTags(place.id, tags)}
                onSetHidden={(hidden) => props.onSetHidden(place.id, hidden)}
                onSetDetails={(details) => props.onSetDetails(place.id, details)}
                onRemove={() => props.onRemovePlace(place.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </Dialog>
  );
}

// ── Place card ─────────────────────────────────────────────────────────────

interface PlaceCardProps {
  place: SystemPlace;
  isMaster: boolean;
  onSetTags: (tags: string[]) => void;
  onSetHidden: (hidden: boolean) => void;
  onSetDetails: (details: { owner?: string; description?: string }) => void;
  onRemove: () => void;
}

function PlaceCard({ place, isMaster, onSetTags, onSetHidden, onSetDetails, onRemove }: PlaceCardProps) {
  const [tagDraft, setTagDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const isCustom = place.id.includes("::custom::");

  const addTag = () => {
    const tag = tagDraft.trim();
    if (!tag || place.tags.includes(tag)) {
      setTagDraft("");
      return;
    }
    onSetTags([...place.tags, tag]);
    setTagDraft("");
  };

  return (
    <li className={`th-place${place.hidden ? " th-place--hidden" : ""}`}>
      <div className="th-place__head">
        <span className="th-place__name">
          {place.name}
          {place.hidden ? <span className="th-place__badge">скрыто</span> : null}
        </span>
        {isMaster ? (
          <div className="th-place__actions">
            <button type="button" className="th-place__act" onClick={() => onSetHidden(!place.hidden)}>
              {place.hidden ? "Показать" : "Скрыть"}
            </button>
            <button type="button" className="th-place__act" onClick={() => setEditing((v) => !v)}>
              {editing ? "Готово" : "Править"}
            </button>
            {isCustom ? (
              <button type="button" className="th-place__act th-place__act--danger" onClick={onRemove}>
                Удалить
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {isMaster && editing ? (
        <div className="th-place__edit">
          <Input
            label="Владелец"
            defaultValue={place.owner}
            fieldSize="sm"
            onBlur={(e) => onSetDetails({ owner: e.target.value })}
          />
          <Textarea
            label="Описание"
            defaultValue={place.description}
            rows={2}
            onBlur={(e) => onSetDetails({ description: e.target.value })}
          />
        </div>
      ) : (
        <>
          {place.owner ? <p className="th-place__owner">Владелец: {place.owner}</p> : null}
          {place.description ? <p className="th-place__desc">{place.description}</p> : null}
        </>
      )}

      <div className="th-place__tags">
        {place.tags.map((tag) => (
          <Tag key={tag} onRemove={() => onSetTags(place.tags.filter((t) => t !== tag))}>
            {tag}
          </Tag>
        ))}
        <form
          className="th-place__tag-add"
          onSubmit={(e) => {
            e.preventDefault();
            addTag();
          }}
        >
          <input
            className="th-place__tag-input"
            value={tagDraft}
            placeholder="+ тег"
            aria-label={`Добавить тег к «${place.name}»`}
            onChange={(e) => setTagDraft(e.target.value)}
          />
        </form>
      </div>
    </li>
  );
}

// ── Add-place form (master) ──────────────────────────────────────────────────

function AddPlaceForm({ onAdd }: { onAdd: (draft: NewPlaceDraft) => void }) {
  const [name, setName] = useState("");
  const [owner, setOwner] = useState("");
  const [description, setDescription] = useState("");

  return (
    <form
      className="th-add-place"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onAdd({ name: name.trim(), owner: owner.trim(), description: description.trim() });
      }}
    >
      <Input label="Название" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      <Input label="Владелец" value={owner} onChange={(e) => setOwner(e.target.value)} />
      <Textarea label="Описание" value={description} rows={2} onChange={(e) => setDescription(e.target.value)} />
      <Button type="submit" size="sm" disabled={!name.trim()}>
        Добавить
      </Button>
    </form>
  );
}

export default SystemModal;
