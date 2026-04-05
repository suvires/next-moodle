"use client";

import { Skeleton } from "boneyard-js/react";

const pageBones = {
  name: "admin-cohorte-detail",
  viewportWidth: 1440,
  width: 100,
  height: 700,
  bones: [
    // back link + title
    { x: 0, y: 0, w: 20, h: 14, r: 4, c: true },
    { x: 0, y: 24, w: 45, h: 28, r: 8 },
    // left column: members card
    { x: 0, y: 70, w: 48, h: 220, r: 12, c: true },
    // left column: add member card
    { x: 0, y: 304, w: 48, h: 120, r: 12, c: true },
    // left column: danger zone
    { x: 0, y: 438, w: 48, h: 80, r: 12, c: true },
    // right column: edit form
    { x: 52, y: 70, w: 48, h: 380, r: 12, c: true },
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
