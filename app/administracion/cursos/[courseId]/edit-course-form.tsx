"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updateCourseAction } from "@/app/actions/admin";
import type { AdminCourse, MoodleCategory } from "@/lib/moodle";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button variant="primary" type="submit" isDisabled={pending}>
      {pending ? "Guardando..." : "Guardar cambios"}
    </Button>
  );
}

export function EditCourseForm({
  course,
  categories,
}: {
  course: AdminCourse;
  categories: MoodleCategory[];
}) {
  const [state, formAction] = useActionState(updateCourseAction, {
    error: null,
    success: false,
  });

  const sorted = [...categories].sort(
    (a, b) => (a.depth ?? 0) - (b.depth ?? 0) || a.name.localeCompare(b.name, "es")
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state.error && <div className="banner-danger"><p>{state.error}</p></div>}
      {state.success && <div className="banner-info"><p>Cambios guardados correctamente.</p></div>}

      <input type="hidden" name="courseId" value={course.id} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fullname">Nombre completo</Label>
        <Input id="fullname" name="fullname" defaultValue={course.fullname} placeholder="Nombre completo del curso" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="shortname">Nombre corto</Label>
        <Input id="shortname" name="shortname" defaultValue={course.shortname} placeholder="Nombre corto del curso" />
      </div>

      {sorted.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="categoryId">Categoría</Label>
          <select
            id="categoryId"
            name="categoryId"
            defaultValue={course.categoryId ?? sorted[0]?.id}
            className="h-11 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] transition hover:border-[var(--line-strong)] focus:border-[var(--foreground)] focus:outline-none"
          >
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
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="summary">Resumen</Label>
        <Textarea id="summary" name="summary" defaultValue={course.summary ?? ""} placeholder="Descripción breve del curso" rows={3} />
      </div>

      <div className="flex items-center gap-2.5 pt-1">
        <input
          id="visible"
          name="visible"
          type="checkbox"
          value="1"
          defaultChecked={course.visible}
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
