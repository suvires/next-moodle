"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { createCourseAction } from "@/app/actions/admin";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button variant="primary" type="submit" isDisabled={pending}>
      {pending ? "Guardando..." : "Crear curso"}
    </Button>
  );
}

export function CreateCourseForm() {
  const [state, formAction] = useActionState(createCourseAction, {
    error: null,
    success: false,
  });

  if (state.success) {
    return (
      <div className="banner-info">
        <p className="font-semibold">Curso creado correctamente.</p>
        <p className="mt-2">
          <Link
            href="/administracion/cursos"
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
        <Label htmlFor="fullname">Nombre completo *</Label>
        <Input
          id="fullname"
          name="fullname"
          placeholder="Ej: Introducción a la programación"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="shortname">Nombre corto *</Label>
        <Input
          id="shortname"
          name="shortname"
          placeholder="Ej: PROG101"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="categoryId">ID de categoría</Label>
        <Input
          id="categoryId"
          name="categoryId"
          type="number"
          defaultValue={1}
          min={1}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="summary">Resumen</Label>
        <Textarea
          id="summary"
          name="summary"
          placeholder="Descripción breve del curso (opcional)"
          rows={3}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="format">Formato</Label>
        <Input
          id="format"
          name="format"
          defaultValue="topics"
          placeholder="topics"
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
        <Label htmlFor="visible">Visible para los alumnos</Label>
      </div>

      {/* Hidden fallback for visible=0 when unchecked */}
      <input type="hidden" name="visible" value="0" />

      <div className="flex items-center gap-3 pt-2">
        <SubmitButton />
        <Link
          href="/administracion/cursos"
          className="inline-flex items-center justify-center rounded-full border border-[var(--line)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--line-strong)] hover:bg-[var(--surface-strong)]"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
