"use client";

import { Skeleton } from "boneyard-js/react";

const pageBones = {
  name: "admin-matriculaciones",
  viewportWidth: 1440,
  width: 100,
  height: 600,
  bones: [
    // header
    { x: 0, y: 0, w: 40, h: 28, r: 8 },
    // search bar
    { x: 0, y: 48, w: 35, h: 36, r: 8, c: true },
    { x: 37, y: 48, w: 12, h: 36, r: 8, c: true },
    // 5 result row bones
    { x: 0, y: 108, w: 100, h: 56, r: 0, c: true },
    { x: 0, y: 165, w: 100, h: 56, r: 0, c: true },
    { x: 0, y: 222, w: 100, h: 56, r: 0, c: true },
    { x: 0, y: 279, w: 100, h: 56, r: 0, c: true },
    { x: 0, y: 336, w: 100, h: 56, r: 0, c: true },
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
        <div className="min-h-[600px] w-full" />
      </Skeleton>
    </div>
  );
}
