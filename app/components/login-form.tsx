"use client";

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
        <Input
          id="password"
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="Contraseña"
          required
        />
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
