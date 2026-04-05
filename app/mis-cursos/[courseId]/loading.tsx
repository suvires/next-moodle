"use client";

import { Skeleton } from "boneyard-js/react";

const pageBones = {
  name: "course-detail",
  viewportWidth: 1440,
  width: 100,
  height: 900,
  bones: [
    // topbar area
    { x: 0, y: 0, w: 100, h: 50, r: 12, c: true },
    // heading area
    { x: 0, y: 70, w: 50, h: 24, r: 8 },
    // course banner
    { x: 0, y: 114, w: 100, h: 140, r: 12, c: true },
    // section 1
    { x: 0, y: 274, w: 100, h: 100, r: 12, c: true },
    // section 2
    { x: 0, y: 394, w: 100, h: 100, r: 12, c: true },
    // section 3
    { x: 0, y: 514, w: 100, h: 100, r: 12, c: true },
    // section 4
    { x: 0, y: 634, w: 100, h: 100, r: 12, c: true },
  ],
};

export default function Loading() {
  return (
    <main className="flex min-h-screen flex-1 px-5 py-6 md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-5xl">
        <Skeleton
          loading
          initialBones={pageBones}
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
