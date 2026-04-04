"use client";

import { Skeleton } from "boneyard-js/react";

const resourcePageBones = {
  name: "resource-page",
  viewportWidth: 1440,
  width: 100,
  height: 980,
  bones: [
    { x: 0, y: 0, w: 14, h: 14, r: 999 },
    { x: 0, y: 52, w: 24, h: 12, r: 999 },
    { x: 0, y: 82, w: 56, h: 46, r: 20 },
    { x: 0, y: 178, w: 100, h: 110, r: 28, c: true },
    { x: 0, y: 332, w: 100, h: 648, r: 28, c: true },
  ],
};

export default function Loading() {
  return (
    <main className="grain-overlay relative flex min-h-screen flex-1 overflow-x-hidden px-5 py-8 md:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <Skeleton
          loading
          initialBones={resourcePageBones}
          className="w-full"
          color="rgba(24, 28, 37, 0.08)"
          darkColor="rgba(255,255,255,0.08)"
        >
          <div className="min-h-[980px] w-full" />
        </Skeleton>
      </div>
    </main>
  );
}
