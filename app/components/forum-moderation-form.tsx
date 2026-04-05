"use client";

import { useActionState } from "react";
import { moderateForumDiscussionAction } from "@/app/actions/forum-moderation";
import { Button } from "@/app/components/ui/button";

const initialState = {
  error: null as string | null,
};

type ForumModerationFormProps = {
  courseId: number;
  forumId: number;
  discussionId: number;
  postId: number;
  returnPath: string;
  isPinned: boolean;
  isLocked: boolean;
};

export function ForumModerationForm({
  courseId,
  forumId,
  discussionId,
  postId,
  returnPath,
  isPinned,
  isLocked,
}: ForumModerationFormProps) {
  const [state, formAction] = useActionState(
    moderateForumDiscussionAction,
    initialState
  );

  return (
    <form action={formAction} className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-soft)] p-4">
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="forumId" value={forumId} />
      <input type="hidden" name="discussionId" value={discussionId} />
      <input type="hidden" name="postId" value={postId} />
      <input type="hidden" name="returnPath" value={returnPath} />

      <p className="text-sm font-semibold text-[var(--color-foreground)]">
        Moderación ligera
      </p>
      <p className="mt-1 text-sm leading-7 text-[var(--color-muted)]">
        Acciones rápidas para fijar, cerrar o eliminar la discusión desde la app.
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <Button
          type="submit"
          name="intent"
          value={isPinned ? "unpin" : "pin"}
          variant="outline"
          size="sm"
        >
          {isPinned ? "Desfijar" : "Fijar"}
        </Button>
        <Button
          type="submit"
          name="intent"
          value={isLocked ? "unlock" : "lock"}
          variant="outline"
          size="sm"
        >
          {isLocked ? "Reabrir" : "Cerrar"}
        </Button>
        <Button
          type="submit"
          name="intent"
          value="delete"
          variant="danger"
          size="sm"
        >
          Eliminar
        </Button>
      </div>

      {state.error ? (
        <p className="mt-3 rounded-lg border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 px-4 py-3 text-sm text-[var(--color-danger)]">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
