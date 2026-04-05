"use client";

import { Skeleton } from "boneyard-js/react";

const reportsPageBones = {
  name: "course-reports",
  viewportWidth: 1440,
  width: 100,
  height: 940,
  bones: [
    { x: 0, y: 0, w: 100, h: 50, r: 12, c: true },
    { x: 0, y: 72, w: 18, h: 12, r: 999 },
    { x: 0, y: 98, w: 30, h: 18, r: 8 },
    { x: 0, y: 132, w: 100, h: 110, r: 28, c: true },
    { x: 0, y: 262, w: 100, h: 90, r: 24, c: true },
    { x: 0, y: 372, w: 100, h: 180, r: 24, c: true },
    { x: 0, y: 572, w: 48, h: 300, r: 24, c: true },
    { x: 52, y: 572, w: 48, h: 300, r: 24, c: true },
  ],
};

export default function Loading() {
  return (
    <main className="flex min-h-screen flex-1 px-5 py-6 md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-5xl">
        <Skeleton
          loading
          initialBones={reportsPageBones}
          className="w-full"
          color="rgba(24, 28, 37, 0.08)"
          darkColor="rgba(255,255,255,0.08)"
        >
          <div className="min-h-[940px] w-full" />
        </Skeleton>
      </div>
    </main>
  );
}
