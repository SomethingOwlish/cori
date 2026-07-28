/**
 * Coriolis Design System — React primitives (TypeScript port).
 *
 * These mirror the shipped design-system components one-to-one, converted to
 * typed TSX so the production app composes the exact same patterns. Structural
 * styling is inline (token-driven, faithful to the source); hover/focus/press
 * live in `primitives.css`.
 *
 * Import from the barrel: `import { Card, Button, StatBlock } from "../design-system"`.
 */

import type {
  ButtonHTMLAttributes,
  CSSProperties,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import "./primitives.css";

const cx = (...parts: (string | false | undefined)[]) => parts.filter(Boolean).join(" ");

// ── Card ─────────────────────────────────────────────────────────────────────
export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  eyebrow?: ReactNode;
  title?: ReactNode;
  action?: ReactNode;
  variant?: "plain" | "gilt";
  padding?: number;
  interactive?: boolean;
}

export function Card({
  children,
  eyebrow,
  title,
  action,
  variant = "plain",
  padding = 20,
  interactive = false,
  className,
  style,
  ...rest
}: CardProps) {
  const gilt = variant === "gilt";
  return (
    <div
      className={cx("crl-card", interactive && "crl-card--interactive", className)}
      style={{
        background: gilt ? "linear-gradient(180deg, var(--hull-2), var(--hull))" : "var(--hull)",
        border: `1px solid ${gilt ? "var(--border-gold)" : "var(--line-soft)"}`,
        borderRadius: "var(--radius-lg)",
        boxShadow: gilt ? "var(--inner-gilt), var(--shadow-md)" : "var(--shadow-sm)",
        overflow: "hidden",
        ...style,
      }}
      {...rest}
    >
      {eyebrow || title || action ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: `14px ${padding}px`,
            borderBottom: "1px solid var(--line-soft)",
            gap: 12,
          }}
        >
          <div style={{ minWidth: 0 }}>
            {eyebrow ? (
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "var(--gold)",
                  marginBottom: 3,
                }}
              >
                {eyebrow}
              </div>
            ) : null}
            {title ? (
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 17,
                  fontWeight: 600,
                  letterSpacing: "0.03em",
                  color: "var(--ivory)",
                }}
              >
                {title}
              </div>
            ) : null}
          </div>
          {action}
        </div>
      ) : null}
      <div style={{ padding }}>{children}</div>
    </div>
  );
}

// ── StatBlock ────────────────────────────────────────────────────────────────
export interface StatBlockProps {
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "gold" | "ivory" | "astral" | "verdant" | "garnet";
  boxed?: boolean;
  align?: "center" | "left";
  style?: CSSProperties;
}

export function StatBlock({ label, value, sub, tone = "gold", boxed = true, align = "center", style }: StatBlockProps) {
  const color =
    ({ gold: "var(--gold-bright)", ivory: "var(--ivory)", astral: "var(--astral)", verdant: "var(--verdant)", garnet: "var(--garnet)" } as const)[tone] ||
    "var(--gold-bright)";
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: align === "center" ? "center" : "flex-start",
        gap: 3,
        padding: boxed ? "12px 14px" : 0,
        background: boxed ? "var(--void)" : "transparent",
        border: boxed ? "1px solid var(--line-soft)" : "none",
        borderRadius: boxed ? "var(--radius-md)" : 0,
        textAlign: align,
        minWidth: boxed ? 68 : undefined,
        ...style,
      }}
    >
      <span style={{ fontFamily: "var(--font-display)", fontSize: 9, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--sand-dim)" }}>
        {label}
      </span>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 26, fontWeight: 600, color, lineHeight: 1 }}>{value}</span>
      {sub ? <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--sand-dim)" }}>{sub}</span> : null}
    </div>
  );
}

// ── Meter ────────────────────────────────────────────────────────────────────
const METER_TONES: Record<string, string> = {
  gold: "linear-gradient(90deg, var(--gold-deep), var(--gold-bright))",
  verdant: "var(--verdant)",
  garnet: "var(--garnet)",
  amber: "var(--amber)",
  astral: "var(--astral)",
};

export interface MeterProps {
  value?: number;
  max?: number;
  tone?: "gold" | "verdant" | "garnet" | "amber" | "astral";
  segments?: number;
  label?: ReactNode;
  showValue?: boolean;
  style?: CSSProperties;
}

export function Meter({ value = 0, max = 10, tone = "gold", segments = 0, label, showValue = true, style }: MeterProps) {
  const pct = Math.max(0, Math.min(1, value / max)) * 100;
  const fill = METER_TONES[tone] || METER_TONES.gold;
  return (
    <div style={{ ...style }}>
      {label || showValue ? (
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          {label ? (
            <span style={{ fontFamily: "var(--font-display)", fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--sand-dim)" }}>
              {label}
            </span>
          ) : (
            <span />
          )}
          {showValue ? (
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--parchment)" }}>
              {value}/{max}
            </span>
          ) : null}
        </div>
      ) : null}
      {segments > 0 ? (
        <div style={{ display: "flex", gap: 4 }}>
          {Array.from({ length: segments }).map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 10,
                borderRadius: "var(--radius-xs)",
                background: i < Math.round((value / max) * segments) ? fill : "var(--void)",
                border: "1px solid var(--line-soft)",
              }}
            />
          ))}
        </div>
      ) : (
        <div style={{ height: 10, borderRadius: "var(--radius-pill)", background: "var(--void)", border: "1px solid var(--line-soft)", overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: fill, borderRadius: "var(--radius-pill)", transition: "width var(--dur-slow) var(--ease-out)" }} />
        </div>
      )}
    </div>
  );
}

// ── Badge ────────────────────────────────────────────────────────────────────
const BADGE_TONES = {
  neutral: { bg: "var(--hull-3)", fg: "var(--parchment)", bd: "var(--line)" },
  gold: { bg: "var(--gold-12)", fg: "var(--gold-bright)", bd: "var(--border-gold)" },
  success: { bg: "var(--verdant-12)", fg: "var(--verdant)", bd: "transparent" },
  warning: { bg: "var(--amber-12)", fg: "var(--amber)", bd: "transparent" },
  danger: { bg: "var(--garnet-12)", fg: "var(--garnet)", bd: "transparent" },
  info: { bg: "var(--lapis-12)", fg: "var(--lapis)", bd: "transparent" },
} as const;

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: keyof typeof BADGE_TONES;
  dot?: boolean;
}

export function Badge({ children, tone = "neutral", dot = false, style, ...rest }: BadgeProps) {
  const t = BADGE_TONES[tone] || BADGE_TONES.neutral;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 9px",
        borderRadius: "var(--radius-pill)",
        background: t.bg,
        color: t.fg,
        border: `1px solid ${t.bd}`,
        fontFamily: "var(--font-display)",
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        ...style,
      }}
      {...rest}
    >
      {dot ? <span style={{ width: 6, height: 6, borderRadius: "50%", background: t.fg }} /> : null}
      {children}
    </span>
  );
}

// ── Tag ──────────────────────────────────────────────────────────────────────
export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  active?: boolean;
  onRemove?: () => void;
  icon?: ReactNode;
}

export function Tag({ children, active = false, onRemove, icon, className, style, ...rest }: TagProps) {
  return (
    <span
      className={cx("crl-tag", rest.onClick && "crl-tag--clickable", className)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 11px",
        borderRadius: "var(--radius-sm)",
        background: active ? "var(--gold-12)" : "var(--hull-3)",
        color: active ? "var(--gold-bright)" : "var(--sand)",
        border: `1px solid ${active ? "var(--border-gold)" : "var(--line-soft)"}`,
        fontFamily: "var(--font-body)",
        fontSize: 12,
        fontWeight: 500,
        whiteSpace: "nowrap",
        ...style,
      }}
      {...rest}
    >
      {icon ? <span style={{ fontSize: 13 }}>{icon}</span> : null}
      {children}
      {onRemove ? (
        <span
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          style={{ marginLeft: 2, opacity: 0.6, cursor: "pointer", fontSize: 13 }}
        >
          ×
        </span>
      ) : null}
    </span>
  );
}

// ── Button ───────────────────────────────────────────────────────────────────
const BTN_SIZES = {
  sm: { padding: "0 12px", height: 32, fontSize: 12 },
  md: { padding: "0 18px", height: 40, fontSize: 13 },
  lg: { padding: "0 26px", height: 48, fontSize: 14 },
} as const;

function btnVariant(variant: string): CSSProperties {
  switch (variant) {
    case "secondary":
      return { background: "var(--gold-12)", color: "var(--gold-bright)", borderColor: "var(--border-gold)" };
    case "ghost":
      return { background: "transparent", color: "var(--sand)", borderColor: "transparent" };
    case "danger":
      return { background: "var(--garnet)", color: "#2a0d0c", borderColor: "transparent", boxShadow: "var(--gloss-gold)" };
    case "primary":
    default:
      return { background: "linear-gradient(180deg, var(--gold-bright), var(--gold-deep))", color: "var(--gold-ink)", borderColor: "transparent", boxShadow: "var(--gloss-gold)" };
  }
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  iconLeft,
  iconRight,
  fullWidth = false,
  className,
  style,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx("crl-btn", `crl-btn--${variant}`, className)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        border: "1px solid transparent",
        borderRadius: "var(--radius-md)",
        fontFamily: "var(--font-display)",
        fontWeight: 600,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        cursor: "pointer",
        whiteSpace: "nowrap",
        userSelect: "none",
        ...BTN_SIZES[size],
        ...btnVariant(variant),
        width: fullWidth ? "100%" : undefined,
        ...style,
      }}
      {...rest}
    >
      {iconLeft ? <span style={{ display: "inline-flex", fontSize: "1.1em" }}>{iconLeft}</span> : null}
      {children}
      {iconRight ? <span style={{ display: "inline-flex", fontSize: "1.1em" }}>{iconRight}</span> : null}
    </button>
  );
}

// ── IconButton ───────────────────────────────────────────────────────────────
const IB_SIZES = { sm: 30, md: 38, lg: 46 } as const;

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "sm" | "md" | "lg";
  variant?: "ghost" | "solid" | "filled";
  label?: string;
}

export function IconButton({ children, size = "md", variant = "ghost", label, className, style, type = "button", ...rest }: IconButtonProps) {
  const dim = IB_SIZES[size] || IB_SIZES.md;
  const variants: Record<string, CSSProperties> = {
    ghost: { background: "transparent", color: "var(--sand)", borderColor: "transparent" },
    solid: { background: "var(--gold-12)", color: "var(--gold-bright)", borderColor: "var(--border-gold)" },
    filled: { background: "linear-gradient(180deg, var(--gold-bright), var(--gold-deep))", color: "var(--gold-ink)", borderColor: "transparent" },
  };
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cx("crl-iconbtn", `crl-iconbtn--${variant}`, className)}
      style={{
        width: dim,
        height: dim,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "var(--radius-md)",
        cursor: "pointer",
        border: "1px solid transparent",
        fontSize: size === "sm" ? 15 : 18,
        ...variants[variant],
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

// ── Input ────────────────────────────────────────────────────────────────────
const FIELD_LABEL: CSSProperties = {
  display: "block",
  fontFamily: "var(--font-display)",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "var(--sand-dim)",
  marginBottom: 7,
};

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  iconLeft?: ReactNode;
  fieldSize?: "sm" | "md" | "lg";
  wrapStyle?: CSSProperties;
}

export function Input({ label, hint, error, iconLeft, fieldSize = "md", id, className, style, wrapStyle, ...rest }: InputProps) {
  const h = fieldSize === "sm" ? 36 : fieldSize === "lg" ? 48 : 44;
  const borderColor = error ? "var(--garnet)" : "var(--border-gold)";
  return (
    <div style={{ display: "block", ...wrapStyle }}>
      {label ? (
        <label htmlFor={id} style={FIELD_LABEL}>
          {label}
        </label>
      ) : null}
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        {iconLeft ? <span style={{ position: "absolute", left: 13, fontSize: 16, color: "var(--sand-dim)", pointerEvents: "none" }}>{iconLeft}</span> : null}
        <input
          id={id}
          className={cx("crl-input", className)}
          style={{
            width: "100%",
            height: h,
            boxSizing: "border-box",
            padding: iconLeft ? "0 14px 0 38px" : "0 14px",
            background: "var(--gold-12)",
            color: "var(--ivory)",
            border: `1px solid ${borderColor}`,
            borderRadius: "var(--radius-md)",
            fontFamily: "var(--font-body)",
            fontSize: 14,
            outline: "none",
            ...style,
          }}
          {...rest}
        />
      </div>
      {error ? (
        <div style={{ fontSize: 12, color: "var(--garnet)", marginTop: 6 }}>{error}</div>
      ) : hint ? (
        <div style={{ fontSize: 12, color: "var(--sand-dim)", marginTop: 6 }}>{hint}</div>
      ) : null}
    </div>
  );
}

// ── Textarea ─────────────────────────────────────────────────────────────────
export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode;
  wrapStyle?: CSSProperties;
}

export function Textarea({ label, id, className, style, wrapStyle, ...rest }: TextareaProps) {
  return (
    <div style={{ display: "block", ...wrapStyle }}>
      {label ? (
        <label htmlFor={id} style={FIELD_LABEL}>
          {label}
        </label>
      ) : null}
      <textarea
        id={id}
        className={cx("crl-input", className)}
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "10px 14px",
          background: "var(--gold-12)",
          color: "var(--ivory)",
          border: "1px solid var(--border-gold)",
          borderRadius: "var(--radius-md)",
          fontFamily: "var(--font-body)",
          fontSize: 14,
          lineHeight: 1.5,
          outline: "none",
          resize: "vertical",
          ...style,
        }}
        {...rest}
      />
    </div>
  );
}

// ── Select ───────────────────────────────────────────────────────────────────
export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: ReactNode;
  wrapStyle?: CSSProperties;
}

export function Select({ label, id, className, style, wrapStyle, children, ...rest }: SelectProps) {
  return (
    <div style={{ display: "block", ...wrapStyle }}>
      {label ? (
        <label htmlFor={id} style={FIELD_LABEL}>
          {label}
        </label>
      ) : null}
      <select
        id={id}
        className={cx("crl-input", className)}
        style={{
          width: "100%",
          height: 44,
          boxSizing: "border-box",
          padding: "0 12px",
          background: "var(--gold-12)",
          color: "var(--ivory)",
          border: "1px solid var(--border-gold)",
          borderRadius: "var(--radius-md)",
          fontFamily: "var(--font-body)",
          fontSize: 14,
          outline: "none",
          ...style,
        }}
        {...rest}
      >
        {children}
      </select>
    </div>
  );
}

// ── Dialog ───────────────────────────────────────────────────────────────────
export interface DialogProps {
  open: boolean;
  onClose?: () => void;
  title?: ReactNode;
  eyebrow?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  width?: number;
}

export function Dialog({ open, onClose, title, eyebrow, children, footer, width = 460 }: DialogProps) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "rgba(4,8,10,0.72)",
        backdropFilter: "blur(3px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width,
          maxWidth: "100%",
          maxHeight: "90vh",
          overflow: "auto",
          background: "linear-gradient(180deg, var(--hull-2), var(--hull))",
          border: "1px solid var(--border-gold)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-xl), var(--inner-gilt)",
          animation: "crlDialogIn var(--dur-med) var(--ease-out)",
        }}
      >
        <style>{`@keyframes crlDialogIn{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:none}}`}</style>
        <div style={{ padding: "20px 24px 0" }}>
          {eyebrow ? (
            <div style={{ fontFamily: "var(--font-display)", fontSize: 10, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 6 }}>
              {eyebrow}
            </div>
          ) : null}
          {title ? (
            <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600, letterSpacing: "0.03em", color: "var(--ivory)", marginBottom: 12 }}>{title}</div>
          ) : null}
        </div>
        <div style={{ padding: "0 24px 4px", color: "var(--sand)", fontSize: 14, lineHeight: 1.55 }}>{children}</div>
        {footer ? <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "18px 24px 22px", marginTop: 8 }}>{footer}</div> : <div style={{ height: 20 }} />}
      </div>
    </div>
  );
}

// ── DicePool ─────────────────────────────────────────────────────────────────
function Die({ value, size = 44 }: { value: ReactNode; size?: number }) {
  const success = typeof value === "number" && value >= 6;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "var(--radius-md)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-mono)",
        fontSize: size * 0.42,
        fontWeight: 600,
        background: success ? "linear-gradient(180deg, var(--gold-bright), var(--gold-deep))" : "var(--void)",
        color: success ? "var(--gold-ink)" : "var(--parchment)",
        border: `1px solid ${success ? "transparent" : "var(--border-gold)"}`,
        boxShadow: success ? "var(--glow-gold)" : "var(--inner-line)",
      }}
    >
      {value}
    </div>
  );
}

export interface DicePoolProps {
  /** Explicit rolled values; if omitted, `count` blank dice show the pool size. */
  dice?: number[];
  count?: number;
  onRoll?: () => void;
  rolling?: boolean;
  dieSize?: number;
  showResult?: boolean;
  style?: CSSProperties;
}

export function DicePool({ dice, count = 6, onRoll, rolling = false, dieSize = 44, showResult = true, style }: DicePoolProps) {
  const values = dice || Array.from({ length: count }, () => null);
  const successes = (dice || []).filter((d) => d >= 6).length;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, ...style }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {values.map((v, i) => (
          <Die key={i} value={v == null ? "·" : v} size={dieSize} />
        ))}
      </div>
      {showResult && dice ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: successes > 0 ? "var(--gold-bright)" : "var(--sand-dim)" }}>
            {successes > 0 ? `Успехов: ${successes}` : "Нет успехов"}
          </span>
          {onRoll ? (
            <button
              onClick={onRoll}
              disabled={rolling}
              style={{
                marginLeft: "auto",
                padding: "7px 16px",
                borderRadius: "var(--radius-md)",
                cursor: "pointer",
                background: "var(--gold-12)",
                color: "var(--gold-bright)",
                border: "1px solid var(--border-gold)",
                fontFamily: "var(--font-display)",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              {rolling ? "Бросок…" : "Переброс"}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

// ── Tabs ─────────────────────────────────────────────────────────────────────
export interface TabDef {
  value: string;
  label: ReactNode;
  badge?: ReactNode;
}

export interface TabsProps {
  tabs?: TabDef[];
  value?: string;
  onChange?: (value: string) => void;
  style?: CSSProperties;
}

export function Tabs({ tabs = [], value, onChange, style }: TabsProps) {
  return (
    <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--line)", ...style }}>
      {tabs.map((t) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            className="crl-tab"
            onClick={() => onChange && onChange(t.value)}
            style={{
              position: "relative",
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "10px 16px 12px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-display)",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: active ? "var(--gold-bright)" : "var(--sand-dim)",
            }}
          >
            {t.label}
            {t.badge != null ? (
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, padding: "1px 6px", borderRadius: "var(--radius-pill)", background: active ? "var(--gold-12)" : "var(--hull-3)", color: active ? "var(--gold-bright)" : "var(--sand)" }}>
                {t.badge}
              </span>
            ) : null}
            {active ? <span style={{ position: "absolute", left: 8, right: 8, bottom: -1, height: 2, background: "linear-gradient(90deg, var(--gold-deep), var(--gold-bright))", borderRadius: 2 }} /> : null}
          </button>
        );
      })}
    </div>
  );
}

// ── Avatar ───────────────────────────────────────────────────────────────────
export interface AvatarProps {
  src?: string;
  name?: string;
  size?: number;
  style?: CSSProperties;
}

export function Avatar({ src, name, size = 44, style }: AvatarProps) {
  const initials = (name || "?")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--hull-3)",
        border: "1px solid var(--border-gold)",
        color: "var(--gold-bright)",
        fontFamily: "var(--font-display)",
        fontWeight: 600,
        fontSize: size * 0.36,
        ...style,
      }}
    >
      {src ? <img src={src} alt={name || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
    </div>
  );
}

// ── Rule (manuscript divider) ────────────────────────────────────────────────
export function Rule({ style }: { style?: CSSProperties }) {
  return <hr className="crl-rule" style={style} />;
}
