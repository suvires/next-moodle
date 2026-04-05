"use client";

import { useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction } from "@/app/actions/auth";
import { Button, LinkButton } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Separator } from "@/app/components/ui/separator";

const initialLoginState = {
  error: null,
};

type LoginFormProps = {
  sessionExpired?: boolean;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button variant="primary" size="lg" className="w-full" isDisabled={pending} type="submit">
      {pending ? "Entrando\u2026" : "Entrar"}
    </Button>
  );
}

export function LoginForm({ sessionExpired = false }: LoginFormProps) {
  const [state, formAction] = useActionState(loginAction, initialLoginState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {sessionExpired && (
        <div className="banner-info">
          Tu sesión ha expirado. Inicia sesión de nuevo.
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor="username" className="text-sm font-medium text-[var(--foreground)]">
          Usuario o email
        </label>
        <Input
          id="username"
          type="text"
          name="username"
          autoComplete="username"
          placeholder="Usuario o email"
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-sm font-medium text-[var(--foreground)]">
          Contraseña
        </label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            name="password"
            autoComplete="current-password"
            placeholder="Contraseña"
            required
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            )}
          </button>
        </div>
      </div>

      {state.error && (
        <div className="banner-danger">{state.error}</div>
      )}

      <div className="mt-3">
        <SubmitButton />
      </div>

      <Separator />

      <p className="text-center">
        <LinkButton href="/auth/recuperar-contrasena" variant="ghost" size="sm">
          ¿Olvidaste tu contraseña?
        </LinkButton>
      </p>
    </form>
  );
}
