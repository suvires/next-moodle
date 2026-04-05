"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  updatePreferencesAction,
  type PreferencesFormState,
} from "@/app/actions/preferences";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";

const initialState: PreferencesFormState = {
  error: null,
  success: false,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} size="sm">
      {pending ? "Guardando..." : "Guardar preferencias"}
    </Button>
  );
}

type PreferencesFormProps = {
  preferences: Array<{ name: string; value: string }>;
};

const KNOWN_PREFERENCES: Record<string, { label: string; description: string }> = {
  email_bounce_count: { label: "Contador de rebotes email", description: "Contador interno de emails rebotados" },
  htmleditor: { label: "Editor de texto", description: "Editor preferido para campos de texto" },
  auth_forcepasswordchange: { label: "Cambio de contraseña", description: "Forzar cambio de contraseña en el siguiente acceso" },
  emailstop: { label: "Detener emails", description: "Desactivar notificaciones por email" },
  maildisplay: { label: "Visibilidad del email", description: "Quién puede ver tu dirección de email" },
  autosubscribe: { label: "Auto-suscripción a foros", description: "Suscribirse automáticamente a los foros en los que publicas" },
  trackforums: { label: "Seguimiento de foros", description: "Resaltar mensajes nuevos en los foros" },
};

function getPreferenceLabel(name: string) {
  return KNOWN_PREFERENCES[name]?.label || name;
}

function getPreferenceDescription(name: string) {
  return KNOWN_PREFERENCES[name]?.description || null;
}

export function PreferencesForm({ preferences }: PreferencesFormProps) {
  const [state, formAction] = useActionState(updatePreferencesAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {preferences.map((pref) => (
        <div key={pref.name} className="flex flex-col gap-1.5">
          <Label htmlFor={`pref-${pref.name}`}>{getPreferenceLabel(pref.name)}</Label>
          <Input
            id={`pref-${pref.name}`}
            name={`pref_${pref.name}`}
            defaultValue={pref.value}
          />
          {getPreferenceDescription(pref.name) ? (
            <p className="text-xs text-[var(--color-muted)]">
              {getPreferenceDescription(pref.name)}
            </p>
          ) : null}
        </div>
      ))}

      {preferences.length === 0 ? (
        <p className="text-sm text-[var(--color-muted)]">
          No hay preferencias editables.
        </p>
      ) : null}

      {state.error ? (
        <p className="rounded-lg border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 px-3 py-2.5 text-sm text-[var(--color-danger)]">
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5 text-sm text-emerald-400">
          Preferencias guardadas.
        </p>
      ) : null}

      {preferences.length > 0 ? <SubmitButton /> : null}
    </form>
  );
}
