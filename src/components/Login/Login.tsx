/**
 * Login — вход в Третий Горизонт.
 *
 * Локальная игра без аккаунтов: назови себя и выбери роль. Ведущий попадает на
 * панель кампаний, игрок — к своим кампаниям и карточке героя. Выбор помнится
 * между перезагрузками (см. `src/session.ts`).
 */

import { useState } from "react";
import type { Role, Session } from "../../session";
import { Button, Card, Input } from "../../design-system";
import "./Login.css";

export interface LoginProps {
  onSignIn: (session: Session) => void;
}

const ROLES: { key: Role; title: string; desc: string }[] = [
  { key: "gm", title: "Ведущий", desc: "Создавай и веди кампании; смотри и правь всех героев." },
  { key: "player", title: "Игрок", desc: "Присоединяйся к кампании по коду и веди свою карточку." },
];

export function Login({ onSignIn }: LoginProps) {
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("gm");

  const trimmed = name.trim();
  const canSubmit = trimmed !== "";

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

          <Input
            label="Позывной"
            value={name}
            placeholder="например, Зара аль-Мадани"
            onChange={(e) => setName(e.target.value)}
            wrapStyle={{ marginTop: 20 }}
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
