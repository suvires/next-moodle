"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/app/components/ui/button";

type QuizFormButtonProps = {
  label: string;
  pendingLabel: string;
  intent: string;
  variant?: "primary" | "outline" | "ghost" | "danger";
  disabled?: boolean;
};

export function QuizFormButton({
  label,
  pendingLabel,
  intent,
  variant = "outline",
  disabled = false,
}: QuizFormButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      name="intent"
      value={intent}
      variant={variant}
      size="sm"
      isDisabled={disabled || pending}
    >
      {pending ? pendingLabel : label}
    </Button>
  );
}
