"use client";

import { Skeleton } from "boneyard-js/react";

const pageBones = {
  name: "admin-dashboard",
  viewportWidth: 1440,
  width: 100,
  height: 700,
  bones: [
    // stat cards 2x2 grid
    { x: 0, y: 0, w: 47, h: 90, r: 12, c: true },
    { x: 53, y: 0, w: 47, h: 90, r: 12, c: true },
    { x: 0, y: 105, w: 47, h: 90, r: 12, c: true },
    { x: 53, y: 105, w: 47, h: 90, r: 12, c: true },
    // section link cards
    { x: 0, y: 230, w: 47, h: 110, r: 12, c: true },
    { x: 53, y: 230, w: 47, h: 110, r: 12, c: true },
    { x: 0, y: 355, w: 47, h: 110, r: 12, c: true },
    { x: 53, y: 355, w: 47, h: 110, r: 12, c: true },
  ],
};

export default function Loading() {
  return (
    <div className="w-full">
      <Skeleton
        loading
        initialBones={pageBones}
        className="w-full"
        color="rgba(24, 28, 37, 0.08)"
        darkColor="rgba(255,255,255,0.08)"
      >
        <div className="min-h-[700px] w-full" />
      </Skeleton>
    </div>
  );
}
