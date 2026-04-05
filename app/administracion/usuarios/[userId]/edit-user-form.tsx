"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updateUserAction } from "@/app/actions/admin";
import type { AdminUser } from "@/lib/moodle";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button variant="primary" type="submit" isDisabled={pending}>
      {pending ? "Guardando..." : "Guardar cambios"}
    </Button>
  );
}

export function EditUserForm({ user }: { user: AdminUser }) {
  const [state, formAction] = useActionState(updateUserAction, {
    error: null,
    success: false,
  });

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="userId" value={user.id} />

      {state.error && (
        <div className="banner-danger">
          <p>{state.error}</p>
        </div>
      )}

      {state.success && (
        <div className="banner-info">
          <p>Cambios guardados correctamente.</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="edit-firstName">Nombre</Label>
          <Input
            id="edit-firstName"
            name="firstName"
            defaultValue={user.firstName}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="edit-lastName">Apellidos</Label>
          <Input
            id="edit-lastName"
            name="lastName"
            defaultValue={user.lastName}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="edit-email">Correo electrónico</Label>
        <Input
          id="edit-email"
          name="email"
          type="email"
          defaultValue={user.email}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="edit-department">Departamento</Label>
        <Input
          id="edit-department"
          name="department"
          defaultValue={user.department ?? ""}
          placeholder="Opcional"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="edit-institution">Institución</Label>
        <Input
          id="edit-institution"
          name="institution"
          defaultValue={user.institution ?? ""}
          placeholder="Opcional"
        />
      </div>

      <div className="pt-2">
        <SubmitButton />
      </div>
    </form>
  );
}
