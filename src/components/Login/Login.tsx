/**
 * Login — the entry screen.
 *
 * You say who you are and pick a role: a Game Master lands on a dashboard where
 * they create and manage campaigns; a Player lands on a screen that lists the
 * campaigns they've joined and lets them join new ones by code. The choice is
 * remembered across reloads via the session (see `src/session.ts`).
 *
 * When Firebase is configured, `onGoogleSignIn` is provided and a "Sign in with
 * Google" button appears; using it authenticates the client and pre-fills the
 * name from the Google profile. The name + role are still confirmed here before
 * entering, so the gameplay identity stays the same regardless of how you
 * authenticate.
 */

import { useState } from "react";
import type { Role, Session } from "../../session";
import "./Login.css";

export interface LoginProps {
  onSignIn: (session: Session) => void;
  /** Signs in with Google, resolving to the display name (or null). */
  onGoogleSignIn?: () => Promise<string | null>;
}

export function Login({ onSignIn, onGoogleSignIn }: LoginProps) {
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("gm");
  const [googleBusy, setGoogleBusy] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  const trimmed = name.trim();
  const canSubmit = trimmed !== "";

  const submit = () => {
    if (!canSubmit) return;
    onSignIn({ name: trimmed, role });
  };

  const handleGoogle = async () => {
    if (!onGoogleSignIn) return;
    setGoogleError(null);
    setGoogleBusy(true);
    try {
      const displayName = await onGoogleSignIn();
      if (displayName) setName(displayName);
    } catch (error) {
      console.error("Вход через Google не удался.", error);
      setGoogleError("Не удалось войти через Google. Попробуй ещё раз.");
    } finally {
      setGoogleBusy(false);
    }
  };

  return (
    <div className="login">
      <form
        className="login__card"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <h2 className="login__title">Добро пожаловать в Cori</h2>
        <p className="login__sub">Войди в Третий Горизонт. Выбери, кто ты.</p>

        {onGoogleSignIn && (
          <>
            <button
              type="button"
              className="login__google"
              onClick={() => void handleGoogle()}
              disabled={googleBusy}
            >
              {googleBusy ? "Вход…" : "Войти через Google"}
            </button>
            {googleError && <p className="login__error">{googleError}</p>}
            <div className="login__divider">
              <span>или по имени</span>
            </div>
          </>
        )}

        <label className="login__field">
          <span>Твоё имя</span>
          <input
            autoFocus
            value={name}
            placeholder="например, Зара аль-Харик"
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <fieldset className="login__roles">
          <legend>Я —</legend>
          <div className="login__role-options">
            <label className={`login__role${role === "gm" ? " login__role--on" : ""}`}>
              <input
                type="radio"
                name="role"
                value="gm"
                checked={role === "gm"}
                onChange={() => setRole("gm")}
              />
              <span className="login__role-title">Ведущий (мастер)</span>
              <span className="login__role-desc">Создавай и веди кампании; смотри всех персонажей.</span>
            </label>
            <label className={`login__role${role === "player" ? " login__role--on" : ""}`}>
              <input
                type="radio"
                name="role"
                value="player"
                checked={role === "player"}
                onChange={() => setRole("player")}
              />
              <span className="login__role-title">Игрок</span>
              <span className="login__role-desc">Присоединяйся к кампании по коду и создавай персонажа.</span>
            </label>
          </div>
        </fieldset>

        <button type="submit" className="login__submit" disabled={!canSubmit}>
          Войти
        </button>
      </form>
    </div>
  );
}

export default Login;
