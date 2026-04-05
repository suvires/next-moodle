"use client";

import { Skeleton } from "boneyard-js/react";

const assignDetailBones = {
  name: "assign-detail",
  viewportWidth: 1440,
  width: 100,
  height: 700,
  bones: [
    { x: 0, y: 0, w: 14, h: 14, r: 999 },
    { x: 0, y: 42, w: 28, h: 12, r: 999 },
    { x: 0, y: 72, w: 100, h: 140, r: 28, c: true },
    { x: 0, y: 236, w: 100, h: 180, r: 28, c: true },
    { x: 0, y: 436, w: 100, h: 120, r: 28, c: true },
  ],
};

export default function Loading() {
  return (
    <main className="flex min-h-screen flex-1 px-5 py-6 md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-5xl">
        <Skeleton
          loading
          initialBones={assignDetailBones}
          className="w-full"
          color="rgba(24, 28, 37, 0.08)"
          darkColor="rgba(255,255,255,0.08)"
        >
          <div className="min-h-[700px] w-full" />
        </Skeleton>
      </div>
    </main>
  );
}
