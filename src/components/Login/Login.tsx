/**
 * Login — вход в Третий Горизонт.
 *
 * Назови себя и выбери роль: ведущий попадает на панель кампаний, игрок — к
 * своим кампаниям и карточке героя. Выбор помнится между перезагрузками
 * (см. `src/session.ts`).
 *
 * Когда настроен Firebase, передаётся `onGoogleSignIn` и появляется кнопка
 * «Войти через Google»: она авторизует клиента и подставляет имя из профиля
 * Google. Имя и роль всё равно подтверждаются здесь, так что игровая личность
 * остаётся одинаковой независимо от способа входа.
 */

import { useState } from "react";
import type { Role, Session } from "../../session";
import { Button, Card, Input } from "../../design-system";
import "./Login.css";

export interface LoginProps {
  onSignIn: (session: Session) => void;
  /** Signs in with Google, resolving to the display name (or null). */
  onGoogleSignIn?: () => Promise<string | null>;
}

const ROLES: { key: Role; title: string; desc: string }[] = [
  { key: "gm", title: "Ведущий", desc: "Создавай и веди кампании; смотри и правь всех героев." },
  { key: "player", title: "Игрок", desc: "Присоединяйся к кампании по коду и веди свою карточку." },
];

export function Login({ onSignIn, onGoogleSignIn }: LoginProps) {
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("gm");
  const [googleBusy, setGoogleBusy] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  const trimmed = name.trim();
  const canSubmit = trimmed !== "";

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
      <Card variant="gilt" className="login__card" padding={28}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit) onSignIn({ name: trimmed, role });
          }}
        >
          <span className="crl-eyebrow">Вход в ложу</span>
          <h2 className="login__title crl-title">С возвращением, космач</h2>
          <p className="login__sub crl-flavor">«Иконы бдят над каждым прыжком. Верь показаниям, не чутью.»</p>

          {onGoogleSignIn && (
            <>
              <Button
                type="button"
                variant="secondary"
                size="lg"
                fullWidth
                onClick={() => void handleGoogle()}
                disabled={googleBusy}
                style={{ marginTop: 20 }}
              >
                {googleBusy ? "Вход…" : "Войти через Google"}
              </Button>
              {googleError && <p className="login__error">{googleError}</p>}
              <div className="login__divider">
                <span>или по позывному</span>
              </div>
            </>
          )}

          <Input
            label="Позывной"
            value={name}
            placeholder="например, Зара аль-Мадани"
            onChange={(e) => setName(e.target.value)}
            wrapStyle={{ marginTop: onGoogleSignIn ? 0 : 20 }}
          />

          <div className="login__roles" role="radiogroup" aria-label="Роль">
            {ROLES.map((r) => (
              <button
                key={r.key}
                type="button"
                role="radio"
                aria-checked={role === r.key}
                className={`login__role${role === r.key ? " login__role--on" : ""}`}
                onClick={() => setRole(r.key)}
              >
                <span className="login__role-title">{r.title}</span>
                <span className="login__role-desc">{r.desc}</span>
              </button>
            ))}
          </div>

          <Button type="submit" size="lg" fullWidth disabled={!canSubmit} style={{ marginTop: 22 }}>
            Войти в Горизонт
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default Login;
