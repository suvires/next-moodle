"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction } from "@/app/actions/auth";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
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
    <Button
      type="submit"
      className="w-full"
      disabled={pending}
    >
      {pending ? "Entrando..." : "Entrar"}
    </Button>
  );
}

export function LoginForm({ sessionExpired = false }: LoginFormProps) {
  const [state, formAction] = useActionState(loginAction, initialLoginState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {sessionExpired ? (
        <p className="rounded-[1rem] border border-[rgba(255,214,102,0.22)] bg-[rgba(255,214,102,0.08)] px-4 py-3 text-sm text-[var(--color-foreground)]">
          Tu sesión ha caducado o ya no es válida. Vuelve a iniciar sesión para continuar.
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="username">Usuario o email</Label>
        <Input
          id="username"
          type="text"
          name="username"
          autoComplete="username"
          placeholder="Tu usuario o email"
          required
        />
        <p className="text-xs leading-6 text-[var(--color-muted)]">
          El acceso por email depende de que tu Moodle también lo permita en el servicio de autenticación.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Contrasena</Label>
        <Input
          id="password"
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
        />
      </div>

      {state.error ? (
        <p className="rounded-[1rem] border border-[rgba(255,124,124,0.24)] bg-[rgba(255,124,124,0.08)] px-4 py-3 text-sm text-[var(--color-danger)]">
          {state.error}
        </p>
      ) : null}

      <Separator />
      <SubmitButton />
    </form>
  );
}
