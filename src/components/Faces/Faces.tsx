import { useCallback, useEffect, useMemo, useState } from "react";
import type { FacesRepository, ThirdHorizonRepository } from "../../data";
import { FACE_TYPES, FACE_TYPE_LABELS, type FaceEntry, type FaceLocation, type FaceType } from "../../domain/coriolis";
import { THIRD_HORIZON_SYSTEMS, emptyState, resolvePlaces } from "../../domain/thirdHorizon";
import { Badge, Button, Dialog, Input, Select, Textarea } from "../../design-system";
import "./Faces.css";

export interface FacesProps { repository: FacesRepository; atlas: ThirdHorizonRepository; role: "gm" | "player"; }
type View = "cards" | "list";
interface PlaceOption { key: string; label: string; location: FaceLocation; }

const makeId = () => typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function Faces({ repository, atlas, role }: FacesProps) {
  const master = role === "gm";
  const [items, setItems] = useState<FaceEntry[]>([]), [query, setQuery] = useState(""), [type, setType] = useState<FaceType | null>(null);
  const [view, setView] = useState<View>("cards"), [selected, setSelected] = useState<FaceEntry | null>(null), [editing, setEditing] = useState<FaceEntry | null | "new">(null);
  const [places, setPlaces] = useState<PlaceOption[]>([]);
  const refresh = useCallback(async () => setItems(await repository.list()), [repository]);
  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => { let cancelled = false; void atlas.load().then((state) => {
    if (cancelled) return; const current = state ?? emptyState();
    setPlaces(THIRD_HORIZON_SYSTEMS.flatMap((system) => resolvePlaces(system, current).map((place) => ({ key: `${system.id}/${place.id}`, label: `${system.name} · ${place.name}`, location: { systemId: system.id, placeId: place.id } }))));
  }); return () => { cancelled = true; }; }, [atlas]);
  const result = useMemo(() => items.filter((item) => (master || !item.hidden) && (!type || item.type === type) && `${item.name} ${item.description}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())), [items, master, query, type]);
  const locationName = (location?: FaceLocation) => places.find((place) => place.location.systemId === location?.systemId && place.location.placeId === location?.placeId)?.label ?? "Место не указано";
  const save = async (entry: FaceEntry) => { await repository.save(entry); await refresh(); setEditing(null); setSelected(entry); };
  const reveal = async (entry: FaceEntry) => { const next = { ...entry, hidden: !entry.hidden }; await repository.save(next); await refresh(); setSelected(next); };
  return <section className="faces">
    <header className="faces__head"><div><p className="crl-eyebrow">Досье кампании · وجوه</p><h2 className="faces__title crl-title">Лица</h2><p className="faces__lede crl-flavor">Те, кого вы встретили. И те, кто пока предпочитает оставаться в тени.</p></div>{master ? <Button onClick={() => setEditing("new")}>＋ Добавить запись</Button> : null}</header>
    <div className="faces__tabs" role="tablist"><button type="button" className={`faces__tab${!type ? " faces__tab--active" : ""}`} onClick={() => setType(null)}>Все <span>{items.filter((item) => master || !item.hidden).length}</span></button>{FACE_TYPES.map((item) => <button key={item} type="button" className={`faces__tab${type === item ? " faces__tab--active" : ""}`} onClick={() => setType(item)}>{FACE_TYPE_LABELS[item]}</button>)}</div>
    <div className="faces__tools"><Input iconLeft="⌕" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск по имени и описанию" wrapStyle={{ flex: "1 1 240px" }} /><div className="faces__view" aria-label="Режим просмотра"><button type="button" className={view === "cards" ? "faces__view--active" : ""} onClick={() => setView("cards")}>Карточки</button><button type="button" className={view === "list" ? "faces__view--active" : ""} onClick={() => setView("list")}>Список</button></div></div>
    <p className="faces__count">Найдено: {result.length}{master ? " · скрытые помечены знаком затмения" : ""}</p>
    {result.length ? <ul className={`faces__entries faces__entries--${view}`}>{result.map((entry) => <li key={entry.id}><FacePreview entry={entry} master={master} location={locationName(entry.lastLocation)} onOpen={() => setSelected(entry)} /></li>)}</ul> : <p className="faces__empty">В этом разделе пока нет подходящих записей.</p>}
    {selected ? <FaceDialog entry={selected} master={master} location={locationName(selected.lastLocation)} onClose={() => setSelected(null)} onEdit={() => { setSelected(null); setEditing(selected); }} onReveal={() => void reveal(selected)} /> : null}
    {master && editing ? <FaceEditor entry={editing === "new" ? null : editing} places={places} onClose={() => setEditing(null)} onSave={save} onDelete={editing === "new" ? undefined : async () => { await repository.delete(editing.id); await refresh(); setEditing(null); }} /> : null}
  </section>;
}

function FacePreview({ entry, master, location, onOpen }: { entry: FaceEntry; master: boolean; location: string; onOpen: () => void }) {
  return <button type="button" className="faces-card" onClick={onOpen}><div className="faces-card__image">{entry.imageUrl ? <img src={entry.imageUrl} alt="" /> : <span className="faces-card__sigil">✦</span>}{master && entry.hidden ? <span className="faces-card__hidden">Скрыто</span> : null}</div><div className="faces-card__body"><Badge tone="neutral">{FACE_TYPE_LABELS[entry.type]}</Badge><strong>{entry.name}</strong><span className="faces-card__place">{location}</span><p>{entry.description}</p></div></button>;
}

function FaceDialog({ entry, master, location, onClose, onEdit, onReveal }: { entry: FaceEntry; master: boolean; location: string; onClose: () => void; onEdit: () => void; onReveal: () => void }) {
  return <Dialog open onClose={onClose} width={720} eyebrow={FACE_TYPE_LABELS[entry.type]} title={entry.name} footer={<><Button variant="ghost" onClick={onClose}>Закрыть</Button>{master ? <Button variant="secondary" onClick={onEdit}>Редактировать</Button> : null}</>}><div className="face-dialog">{entry.imageUrl ? <img className="face-dialog__image" src={entry.imageUrl} alt="" /> : null}<p className="face-dialog__description">{entry.description}</p>{master && entry.masterDescription ? <div className="face-dialog__master"><span className="crl-eyebrow">Только для мастера</span>{entry.masterDescription}</div> : null}{entry.statBlock ? <pre className="face-dialog__stats">{entry.statBlock}</pre> : null}<div className="face-dialog__location"><span>Последнее известное место</span><b>{location}</b></div>{master ? <Button size="sm" variant={entry.hidden ? "primary" : "ghost"} onClick={onReveal}>{entry.hidden ? "Раскрыть игрокам" : "Скрыть от игроков"}</Button> : null}</div></Dialog>;
}

function FaceEditor({ entry, places, onClose, onSave, onDelete }: { entry: FaceEntry | null; places: PlaceOption[]; onClose: () => void; onSave: (entry: FaceEntry) => void; onDelete?: () => void }) {
  const [type, setType] = useState<FaceType>(entry?.type ?? "person"), [name, setName] = useState(entry?.name ?? ""), [description, setDescription] = useState(entry?.description ?? ""), [masterDescription, setMasterDescription] = useState(entry?.masterDescription ?? ""), [imageUrl, setImageUrl] = useState(entry?.imageUrl ?? ""), [statEnabled, setStatEnabled] = useState(Boolean(entry?.statBlock)), [statBlock, setStatBlock] = useState(entry?.statBlock ?? ""), [hidden, setHidden] = useState(entry?.hidden ?? true);
  const initialPlace = entry?.lastLocation ? places.find((place) => place.location.systemId === entry.lastLocation?.systemId && place.location.placeId === entry.lastLocation?.placeId)?.key ?? "" : "";
  const [placeKey, setPlaceKey] = useState(initialPlace);
  const submit = () => { if (!name.trim() || !description.trim()) return; const location = places.find((place) => place.key === placeKey)?.location; onSave({ id: entry?.id ?? makeId(), type, name: name.trim(), description: description.trim(), masterDescription: masterDescription.trim() || undefined, imageUrl: imageUrl.trim() || undefined, statBlock: statEnabled && statBlock.trim() ? statBlock.trim() : undefined, lastLocation: location, hidden }); };
  return <Dialog open onClose={onClose} width={640} eyebrow="Лица" title={entry ? "Редактировать запись" : "Новая запись"} footer={<>{onDelete ? <Button variant="danger" onClick={onDelete}>Удалить</Button> : null}<span style={{ flex: 1 }} /><Button variant="ghost" onClick={onClose}>Отмена</Button><Button onClick={submit} disabled={!name.trim() || !description.trim()}>Сохранить</Button></>}><div className="faces-form"><div className="faces-form__row"><Select label="Тип записи" value={type} onChange={(event) => setType(event.target.value as FaceType)} wrapStyle={{ flex: "1 1 180px" }}>{FACE_TYPES.map((item) => <option key={item} value={item}>{FACE_TYPE_LABELS[item]}</option>)}</Select><Input label={type === "person" || type === "mystic" ? "Имя" : "Название"} value={name} onChange={(event) => setName(event.target.value)} wrapStyle={{ flex: "2 1 250px" }} /></div><Input label="Ссылка на картинку" type="url" placeholder="https://…" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} /><Textarea label="Описание" value={description} onChange={(event) => setDescription(event.target.value)} rows={3} /><Textarea label="Описание для мастера" value={masterDescription} onChange={(event) => setMasterDescription(event.target.value)} rows={3} /><Select label="Последнее место" value={placeKey} onChange={(event) => setPlaceKey(event.target.value)}><option value="">Не указано</option>{places.map((place) => <option key={place.key} value={place.key}>{place.label}</option>)}</Select><label className="faces-form__check"><input type="checkbox" checked={statEnabled} onChange={(event) => setStatEnabled(event.target.checked)} /> Использовать стат-блок</label>{statEnabled ? <Textarea label="Стат-блок" value={statBlock} onChange={(event) => setStatBlock(event.target.value)} rows={4} /> : null}<label className="faces-form__check"><input type="checkbox" checked={hidden} onChange={(event) => setHidden(event.target.checked)} /> Скрыть от игроков</label></div></Dialog>;
}

export default Faces;
