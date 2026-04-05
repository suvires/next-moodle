"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction } from "@/app/actions/auth";

const initialLoginState = {
  error: null,
};

type LoginFormProps = {
  sessionExpired?: boolean;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="h-12 w-full rounded-full bg-[var(--accent)] text-base font-bold text-white transition hover:scale-[1.02] hover:bg-[var(--accent-soft)] active:scale-100 disabled:pointer-events-none disabled:opacity-40"
    >
      {pending ? "Entrando\u2026" : "Entrar"}
    </button>
  );
}

export function LoginForm({ sessionExpired = false }: LoginFormProps) {
  const [state, formAction] = useActionState(loginAction, initialLoginState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {sessionExpired && (
        <p className="rounded-lg bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--muted)]">
          Tu sesión ha expirado. Inicia sesión de nuevo.
        </p>
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor="username" className="text-sm font-bold text-[var(--color-foreground)]">
          Usuario o email
        </label>
        <input
          id="username"
          type="text"
          name="username"
          autoComplete="username"
          placeholder="Usuario o email"
          required
          className="h-12 w-full rounded-md border border-[var(--line-strong)] bg-[var(--surface)] px-4 text-base text-[var(--color-foreground)] outline-none transition placeholder:text-[var(--muted)] hover:border-[var(--foreground)] focus:border-[var(--foreground)] focus:ring-2 focus:ring-[var(--foreground)]/10"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-sm font-bold text-[var(--color-foreground)]">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="Contraseña"
          required
          className="h-12 w-full rounded-md border border-[var(--line-strong)] bg-[var(--surface)] px-4 text-base text-[var(--color-foreground)] outline-none transition placeholder:text-[var(--muted)] hover:border-[var(--foreground)] focus:border-[var(--foreground)] focus:ring-2 focus:ring-[var(--foreground)]/10"
        />
      </div>

      {state.error && (
        <p className="text-sm text-[var(--danger)]">
          {state.error}
        </p>
      )}

      <div className="mt-3">
        <SubmitButton />
      </div>

      <hr className="border-[var(--line)]" />

      <p className="text-center">
        <a href="#" className="text-sm font-medium text-[var(--color-foreground)] underline underline-offset-2 hover:text-[var(--accent)]">
          ¿Olvidaste tu contraseña?
        </a>
      </p>
    </form>
  );
}
