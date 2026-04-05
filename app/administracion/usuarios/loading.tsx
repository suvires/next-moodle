"use client";

import { Skeleton } from "boneyard-js/react";

const pageBones = {
  name: "admin-usuarios",
  viewportWidth: 1440,
  width: 100,
  height: 700,
  bones: [
    // header + search bar
    { x: 0, y: 0, w: 40, h: 28, r: 8 },
    { x: 0, y: 48, w: 35, h: 36, r: 8, c: true },
    { x: 37, y: 48, w: 12, h: 36, r: 8, c: true },
    // 8 user row bones
    { x: 0, y: 110, w: 100, h: 52, r: 0, c: true },
    { x: 0, y: 163, w: 100, h: 52, r: 0, c: true },
    { x: 0, y: 216, w: 100, h: 52, r: 0, c: true },
    { x: 0, y: 269, w: 100, h: 52, r: 0, c: true },
    { x: 0, y: 322, w: 100, h: 52, r: 0, c: true },
    { x: 0, y: 375, w: 100, h: 52, r: 0, c: true },
    { x: 0, y: 428, w: 100, h: 52, r: 0, c: true },
    { x: 0, y: 481, w: 100, h: 52, r: 0, c: true },
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
