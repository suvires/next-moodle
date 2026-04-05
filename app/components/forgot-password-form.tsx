"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { requestPasswordResetAction } from "@/app/actions/auth";
import { Button, LinkButton } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";

const initialState = { error: null, success: false };

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button variant="primary" size="lg" className="w-full" isDisabled={pending} type="submit">
      {pending ? "Enviando\u2026" : "Enviar enlace"}
    </Button>
  );
}

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(
    requestPasswordResetAction,
    initialState
  );

  if (state.success) {
    return (
      <div className="flex flex-col gap-5">
        <p className="banner-info">
          Si existe esa cuenta, recibirás un correo de Moodle para restablecer tu contraseña.
        </p>
        <LinkButton href="/login" variant="ghost" size="sm" className="self-center">
          Volver al inicio de sesión
        </LinkButton>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label
          htmlFor="identifier"
          className="text-sm font-medium text-[var(--foreground)]"
        >
          Usuario o email
        </label>
        <Input
          id="identifier"
          type="text"
          name="identifier"
          autoComplete="username"
          placeholder="Usuario o email"
          required
        />
      </div>

      {state.error && (
        <p className="banner-danger">{state.error}</p>
      )}

      <div className="mt-3">
        <SubmitButton />
      </div>

    </form>
  );
}
