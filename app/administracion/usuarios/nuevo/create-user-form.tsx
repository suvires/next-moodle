"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { createUserAction } from "@/app/actions/admin";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button variant="primary" type="submit" isDisabled={pending}>
      {pending ? "Guardando..." : "Crear usuario"}
    </Button>
  );
}

export function CreateUserForm() {
  const [state, formAction] = useActionState(createUserAction, {
    error: null,
    success: false,
  });

  if (state.success) {
    return (
      <div className="banner-info">
        <p className="font-semibold">Usuario creado correctamente.</p>
        <p className="mt-2">
          <Link
            href="/administracion/usuarios"
            className="font-medium underline underline-offset-2"
          >
            Ver lista
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state.error && (
        <div className="banner-danger">
          <p>{state.error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="firstName">Nombre *</Label>
          <Input
            id="firstName"
            name="firstName"
            placeholder="Ej: Ana"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="lastName">Apellidos *</Label>
          <Input
            id="lastName"
            name="lastName"
            placeholder="Ej: García López"
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Correo electrónico *</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="usuario@ejemplo.com"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="username">Nombre de usuario *</Label>
        <Input
          id="username"
          name="username"
          placeholder="nombre.usuario"
          autoComplete="off"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Contraseña *</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Mínimo 8 caracteres"
          autoComplete="new-password"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="auth">Autenticación</Label>
        <Input
          id="auth"
          name="auth"
          defaultValue="manual"
          placeholder="manual"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="department">Departamento</Label>
        <Input
          id="department"
          name="department"
          placeholder="Opcional"
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <SubmitButton />
        <Link
          href="/administracion/usuarios"
          className="inline-flex items-center justify-center rounded-full border border-[var(--line)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--line-strong)] hover:bg-[var(--surface-strong)]"
        >
          Cancelar
        </Link>

      </div>
    </form>
  );
}
