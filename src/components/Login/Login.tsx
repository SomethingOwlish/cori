/**
 * Login — the entry screen.
 *
 * Local play has no accounts or passwords: you simply say who you are and pick a
 * role. A Game Master lands on a dashboard where they create and manage
 * campaigns; a Player lands on a screen that lists the campaigns they've joined
 * and lets them join new ones by code. The choice is remembered across reloads
 * via the session (see `src/session.ts`).
 */

import { useState } from "react";
import type { Role, Session } from "../../session";
import "./Login.css";

export interface LoginProps {
  onSignIn: (session: Session) => void;
}

export function Login({ onSignIn }: LoginProps) {
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("gm");

  const trimmed = name.trim();
  const canSubmit = trimmed !== "";

  const submit = () => {
    if (!canSubmit) return;
    onSignIn({ name: trimmed, role });
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
        <h2 className="login__title">Welcome to Cori</h2>
        <p className="login__sub">Enter the Third Horizon. Choose who you are.</p>

        <label className="login__field">
          <span>Your name</span>
          <input
            autoFocus
            value={name}
            placeholder="e.g. Zara al-Hariq"
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <fieldset className="login__roles">
          <legend>I am a…</legend>
          <div className="login__role-options">
            <label className={`login__role${role === "gm" ? " login__role--on" : ""}`}>
              <input
                type="radio"
                name="role"
                value="gm"
                checked={role === "gm"}
                onChange={() => setRole("gm")}
              />
              <span className="login__role-title">Game Master</span>
              <span className="login__role-desc">Create and run campaigns; view every character.</span>
            </label>
            <label className={`login__role${role === "player" ? " login__role--on" : ""}`}>
              <input
                type="radio"
                name="role"
                value="player"
                checked={role === "player"}
                onChange={() => setRole("player")}
              />
              <span className="login__role-title">Player</span>
              <span className="login__role-desc">Join a campaign by code and build your character.</span>
            </label>
          </div>
        </fieldset>

        <button type="submit" className="login__submit" disabled={!canSubmit}>
          Enter
        </button>
      </form>
    </div>
  );
}

export default Login;
