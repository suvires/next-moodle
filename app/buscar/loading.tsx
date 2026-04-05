"use client";

import { Skeleton } from "boneyard-js/react";

const pageBones = {
  name: "search",
  viewportWidth: 1440,
  width: 100,
  height: 600,
  bones: [
    // topbar area
    { x: 0, y: 0, w: 100, h: 50, r: 12, c: true },
    // search bar
    { x: 0, y: 70, w: 100, h: 44, r: 12, c: true },
    // result item 1
    { x: 0, y: 134, w: 100, h: 70, r: 12, c: true },
    // result item 2
    { x: 0, y: 224, w: 100, h: 70, r: 12, c: true },
    // result item 3
    { x: 0, y: 314, w: 100, h: 70, r: 12, c: true },
    // result item 4
    { x: 0, y: 404, w: 100, h: 70, r: 12, c: true },
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
          <div className="min-h-[600px] w-full" />
        </Skeleton>
      </div>
    </main>
  );
}
