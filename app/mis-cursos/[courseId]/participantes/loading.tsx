"use client";

import { Skeleton } from "boneyard-js/react";

const participantsPageBones = {
  name: "participants-page",
  viewportWidth: 1440,
  width: 100,
  height: 760,
  bones: [
    { x: 0, y: 0, w: 100, h: 50, r: 12, c: true },
    { x: 0, y: 72, w: 22, h: 12, r: 999 },
    { x: 0, y: 98, w: 36, h: 18, r: 8 },
    { x: 0, y: 132, w: 100, h: 124, r: 28, c: true },
    { x: 0, y: 276, w: 100, h: 98, r: 20, c: true },
    { x: 0, y: 394, w: 100, h: 88, r: 20, c: true },
    { x: 0, y: 502, w: 100, h: 88, r: 20, c: true },
    { x: 0, y: 610, w: 100, h: 88, r: 20, c: true },
  ],
};

export default function Loading() {
  return (
    <main className="flex min-h-screen flex-1 px-5 py-6 md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-5xl">
        <Skeleton
          loading
          initialBones={participantsPageBones}
          className="w-full"
          color="rgba(24, 28, 37, 0.08)"
          darkColor="rgba(255,255,255,0.08)"
        >
          <div className="min-h-[760px] w-full" />
        </Skeleton>
      </div>
    </main>
  );
}
