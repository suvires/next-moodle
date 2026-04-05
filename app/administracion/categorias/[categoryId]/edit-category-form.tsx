"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updateCategoryAction } from "@/app/actions/admin";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import type { MoodleCategory } from "@/lib/moodle";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button variant="primary" type="submit" isDisabled={pending}>
      {pending ? "Guardando..." : "Guardar cambios"}
    </Button>
  );
}

export function EditCategoryForm({
  category,
  allCategories,
}: {
  category: MoodleCategory;
  allCategories: MoodleCategory[];
}) {
  const [state, formAction] = useActionState(updateCategoryAction, {
    error: null,
    success: false,
  });

  const sorted = [...allCategories]
    .filter((c) => c.id !== category.id)
    .sort((a, b) => (a.depth ?? 0) - (b.depth ?? 0) || a.name.localeCompare(b.name, "es"));

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state.error && <div className="banner-danger"><p>{state.error}</p></div>}
      {state.success && <div className="banner-info"><p>Cambios guardados correctamente.</p></div>}

      <input type="hidden" name="categoryId" value={category.id} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" name="name" defaultValue={category.name} placeholder="Nombre de la categoría" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="parentId">Categoría padre</Label>
        <select
          id="parentId"
          name="parentId"
          defaultValue={category.parentId ?? 0}
          className="h-11 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] transition hover:border-[var(--line-strong)] focus:border-[var(--foreground)] focus:outline-none"
        >
          <option value="0">— Sin categoría padre (raíz)</option>
          {sorted.map((cat) => {
            const depth = (cat.depth ?? 1) - 1;
            const prefix = depth > 0 ? "  ".repeat(depth) + "└ " : "";
            return (
              <option key={cat.id} value={cat.id}>
                {prefix}{cat.name}
              </option>
            );
          })}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="idNumber">Número de identificación</Label>
        <Input id="idNumber" name="idNumber" defaultValue={category.idNumber ?? ""} placeholder="Ej: CAT-001" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Descripción</Label>
        <Textarea id="description" name="description" defaultValue={category.description ?? ""} rows={3} />
      </div>

      <div className="flex items-center gap-2.5 pt-1">
        <input
          id="visible"
          name="visible"
          type="checkbox"
          value="1"
          defaultChecked={category.visible !== false}
          className="h-4 w-4 rounded accent-[var(--accent)]"
        />
        <Label htmlFor="visible">Visible para los alumnos</Label>
      </div>
      <input type="hidden" name="visible" value="0" />

      <div className="pt-2">
        <SubmitButton />
      </div>
    </form>
  );
}
