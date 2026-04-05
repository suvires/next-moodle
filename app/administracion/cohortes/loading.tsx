"use client";

import { Skeleton } from "boneyard-js/react";

const pageBones = {
  name: "admin-cohortes",
  viewportWidth: 1440,
  width: 100,
  height: 500,
  bones: [
    // header + create button
    { x: 0, y: 0, w: 30, h: 28, r: 8 },
    { x: 80, y: 0, w: 20, h: 28, r: 20, c: true },
    // 5 cohort row bones
    { x: 0, y: 56, w: 100, h: 56, r: 0, c: true },
    { x: 0, y: 113, w: 100, h: 56, r: 0, c: true },
    { x: 0, y: 170, w: 100, h: 56, r: 0, c: true },
    { x: 0, y: 227, w: 100, h: 56, r: 0, c: true },
    { x: 0, y: 284, w: 100, h: 56, r: 0, c: true },
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
        <div className="min-h-[500px] w-full" />
      </Skeleton>
    </div>
  );
}
