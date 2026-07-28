/**
 * The Third Horizon portal graph — a read-only SVG star chart.
 *
 * Nodes and portals come straight from the canonical map; they are never created
 * or moved here. The view supports pan (drag) and zoom (wheel / buttons) only.
 * The system marked «вы здесь» gets a highlighted double-ring frame. Clicking a
 * node opens its system modal (handled by the parent via `onSelect`).
 */

import { useMemo, useRef, useState, type PointerEvent, type WheelEvent } from "react";
import {
  THIRD_HORIZON_PORTALS,
  THIRD_HORIZON_SYSTEMS,
  type StarSystem,
  type SystemStatus,
} from "../../domain/thirdHorizon";

/** Node fill per system status, echoing the map's legend dots. */
const STATUS_FILL: Record<SystemStatus, string> = {
  faction: "#b06cc8",
  civilized: "#79b84a",
  frontier: "var(--gold-bright)",
  undeveloped: "#c0463f",
};

export interface SystemGraphProps {
  currentSystemId: string | null;
  /** Systems with at least one place visible to the current viewer — get a place marker. */
  systemsWithPlaces: Set<string>;
  onSelect: (systemId: string) => void;
}

interface ViewBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Bounding box of all nodes, padded, in map coordinates. */
function baseViewBox(): ViewBox {
  const xs = THIRD_HORIZON_SYSTEMS.map((s) => s.x);
  const ys = THIRD_HORIZON_SYSTEMS.map((s) => s.y);
  const pad = 110;
  const minX = Math.min(...xs) - pad;
  const minY = Math.min(...ys) - pad;
  return {
    x: minX,
    y: minY,
    w: Math.max(...xs) + pad - minX,
    h: Math.max(...ys) + pad - minY,
  };
}

export function SystemGraph({ currentSystemId, systemsWithPlaces, onSelect }: SystemGraphProps) {
  const base = useMemo(baseViewBox, []);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const moved = useRef(false);

  // Zoom keeps the box centred; pan is applied in map units so it scales with zoom.
  const view: ViewBox = {
    w: base.w / zoom,
    h: base.h / zoom,
    x: base.x + (base.w - base.w / zoom) / 2 + pan.x,
    y: base.y + (base.h - base.h / zoom) / 2 + pan.y,
  };

  const onWheel = (e: WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    setZoom((z) => Math.min(4, Math.max(1, z * (e.deltaY < 0 ? 1.12 : 0.89))));
  };

  const onPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    drag.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    moved.current = false;
    (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    const d = drag.current;
    if (!d) return;
    const svg = e.currentTarget as SVGSVGElement;
    const scale = view.w / svg.clientWidth; // map units per screen pixel
    const dx = (e.clientX - d.x) * scale;
    const dy = (e.clientY - d.y) * scale;
    if (Math.abs(e.clientX - d.x) + Math.abs(e.clientY - d.y) > 3) moved.current = true;
    setPan({ x: d.panX - dx, y: d.panY - dy });
  };

  const onPointerUp = (e: PointerEvent<SVGSVGElement>) => {
    drag.current = null;
    (e.currentTarget as SVGSVGElement).releasePointerCapture?.(e.pointerId);
  };

  const reset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="th-graph">
      <svg
        className="th-graph__svg"
        viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
        role="group"
        aria-label="Карта Третьего Горизонта"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <defs>
          <radialGradient id="th-node" cx="50%" cy="42%" r="60%">
            <stop offset="0%" stopColor="#fff6dd" />
            <stop offset="55%" stopColor="var(--gold-bright)" />
            <stop offset="100%" stopColor="var(--gold-deep)" />
          </radialGradient>
        </defs>

        {/* Portals */}
        <g strokeLinecap="round" fill="none">
          {THIRD_HORIZON_PORTALS.map((p, i) => {
            const a = byId(p.a);
            const b = byId(p.b);
            const hazard = p.hazard;
            return (
              <line
                key={i}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={hazard === "dangerous" ? "#d95a50" : hazard === "unstable" ? "#e6b143" : "#c9a967"}
                strokeWidth={hazard ? 2.4 : 2.2}
                strokeDasharray={hazard === "dangerous" ? "3 6" : hazard === "unstable" ? "7 6" : undefined}
                opacity={hazard ? 0.95 : 0.78}
              />
            );
          })}
        </g>

        {/* Nodes */}
        {THIRD_HORIZON_SYSTEMS.map((s) => {
          const isHere = s.id === currentSystemId;
          return (
            <g
              key={s.id}
              className="th-node"
              transform={`translate(${s.x} ${s.y})`}
              onClick={() => {
                if (!moved.current) onSelect(s.id);
              }}
              role="button"
              tabIndex={0}
              aria-label={`Система ${s.name}${isHere ? " — вы здесь" : ""}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(s.id);
                }
              }}
            >
              {/* Generous invisible hit target: the visible dot is only ~8px,
                  and the label/port don't catch clicks, so without this a node
                  is easy to miss (worst at the map's edges). */}
              <circle r={21} className="th-node__hit" />
              {isHere ? (
                <>
                  <circle r={17} className="th-node__here-glow" />
                  <circle r={13} className="th-node__here-ring" />
                  <circle r={16.5} className="th-node__here-frame" />
                </>
              ) : null}
              <circle r={6.2} fill="url(#th-node)" stroke="var(--gold-deep)" strokeWidth={0.8} />
              {s.status !== "frontier" ? (
                <circle r={3} cy={0} fill={STATUS_FILL[s.status]} opacity={0.95} />
              ) : null}
              {systemsWithPlaces.has(s.id) ? (
                <circle className="th-node__place-dot" r={2.1} cx={9} cy={-8} />
              ) : null}
              <text className="th-node__label" x={0} y={-13} textAnchor="middle">
                {s.name}
              </text>
              {s.spaceport ? (
                <text className="th-node__port" x={0} y={19} textAnchor="middle">
                  ✦
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>

      <div className="th-graph__controls">
        <button type="button" aria-label="Приблизить" onClick={() => setZoom((z) => Math.min(4, z * 1.2))}>
          +
        </button>
        <button type="button" aria-label="Отдалить" onClick={() => setZoom((z) => Math.max(1, z * 0.83))}>
          −
        </button>
        <button type="button" aria-label="Сбросить вид" onClick={reset}>
          ⤢
        </button>
      </div>

      <ul className="th-graph__legend" aria-label="Легенда">
        <li><span className="th-dot" style={{ background: STATUS_FILL.faction }} />Владения фракции</li>
        <li><span className="th-dot" style={{ background: STATUS_FILL.civilized }} />Цивилизованная</li>
        <li><span className="th-dot" style={{ background: "var(--gold-bright)" }} />Пограничная</li>
        <li><span className="th-dot" style={{ background: STATUS_FILL.undeveloped }} />Неосвоенная</li>
        <li><span className="th-line th-line--unstable" />Нестабильные врата</li>
        <li><span className="th-line th-line--danger" />Опасная территория</li>
      </ul>
    </div>
  );
}

function byId(id: string): StarSystem {
  const s = THIRD_HORIZON_SYSTEMS.find((x) => x.id === id);
  if (!s) throw new Error(`Unknown system ${id}`);
  return s;
}

export default SystemGraph;
