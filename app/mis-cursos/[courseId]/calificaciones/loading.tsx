"use client";

import { Skeleton } from "boneyard-js/react";

const gradesPageBones = {
  name: "grades-page",
  viewportWidth: 1440,
  width: 100,
  height: 900,
  bones: [
    { x: 0, y: 0, w: 14, h: 14, r: 999 },
    { x: 0, y: 42, w: 28, h: 12, r: 999 },
    { x: 0, y: 72, w: 100, h: 130, r: 28, c: true },
    { x: 0, y: 226, w: 100, h: 64, r: 20, c: true },
    { x: 0, y: 306, w: 100, h: 64, r: 20, c: true },
    { x: 0, y: 386, w: 100, h: 64, r: 20, c: true },
    { x: 0, y: 466, w: 100, h: 64, r: 20, c: true },
    { x: 0, y: 546, w: 100, h: 64, r: 20, c: true },
    { x: 0, y: 626, w: 100, h: 64, r: 20, c: true },
  ],
};

export default function Loading() {
  return (
    <main className="flex min-h-screen flex-1 px-5 py-6 md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-5xl">
        <Skeleton
          loading
          initialBones={gradesPageBones}
          className="w-full"
          color="rgba(24, 28, 37, 0.08)"
          darkColor="rgba(255,255,255,0.08)"
        >
          <div className="min-h-[900px] w-full" />
        </Skeleton>
      </div>
    </main>
  );
}
