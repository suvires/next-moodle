"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { createCohortAction } from "@/app/actions/admin";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button variant="primary" type="submit" isDisabled={pending}>
      {pending ? "Guardando..." : "Crear cohorte"}
    </Button>
  );
}

export function CreateCohortForm() {
  const [state, formAction] = useActionState(createCohortAction, {
    error: null,
    success: false,
  });

  if (state.success) {
    return (
      <div className="banner-info">
        <p className="font-semibold">Cohorte creada correctamente.</p>
        <p className="mt-2">
          <Link
            href="/administracion/cohortes"
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

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Nombre *</Label>
        <Input
          id="name"
          name="name"
          placeholder="Ej: Alumnos 2024"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="idNumber">Identificador</Label>
        <Input
          id="idNumber"
          name="idNumber"
          placeholder="Opcional (ej: cohort_2024)"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Descripción de la cohorte (opcional)"
          rows={3}
        />
      </div>

      <div className="flex items-center gap-2.5 pt-1">
        <input
          id="visible"
          name="visible"
          type="checkbox"
          value="1"
          defaultChecked
          className="h-4 w-4 rounded accent-[var(--accent)]"
        />
        <Label htmlFor="visible">Visible</Label>
      </div>

      {/* Hidden fallback for visible=0 when unchecked */}
      <input type="hidden" name="visible" value="0" />

      <div className="flex items-center gap-3 pt-2">
        <SubmitButton />
        <Link
          href="/administracion/cohortes"
          className="inline-flex items-center justify-center rounded-full border border-[var(--line)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--line-strong)] hover:bg-[var(--surface-strong)]"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
