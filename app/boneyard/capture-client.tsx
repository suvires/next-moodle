"use client";

import { Skeleton } from "boneyard-js/react";
import {
  BONEYARD_SKELETON_NAMES,
  getBoneyardFixture,
} from "@/app/components/boneyard-fixtures";

export function BoneyardCaptureClient() {
  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">
            Boneyard Capture
          </h1>
          <p className="text-sm text-[var(--muted)]">
            Fixtures usadas por <code>boneyard-js build</code> para regenerar los
            skeletons del proyecto.
          </p>
        </header>

        {BONEYARD_SKELETON_NAMES.map((name) => {
          const fixture = getBoneyardFixture(name);

          return (
            <section
              key={name}
              className="space-y-3 rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface-soft)] p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                {name}
              </p>
              <Skeleton name={name} loading={false} fixture={fixture} fallback={fixture}>
                <div />
              </Skeleton>
            </section>
          );
        })}
      </div>
    </main>
  );
}
