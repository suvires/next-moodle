"use client";

import { Skeleton } from "boneyard-js/react";

const pageBones = {
  name: "admin-cursos",
  viewportWidth: 1440,
  width: 100,
  height: 700,
  bones: [
    // header + create button
    { x: 0, y: 0, w: 30, h: 28, r: 8 },
    { x: 80, y: 0, w: 20, h: 28, r: 20, c: true },
    // search bar
    { x: 0, y: 50, w: 35, h: 36, r: 8, c: true },
    { x: 37, y: 50, w: 12, h: 36, r: 8, c: true },
    // 6 card bones in a grid (3 columns)
    { x: 0, y: 110, w: 32, h: 130, r: 12, c: true },
    { x: 34, y: 110, w: 32, h: 130, r: 12, c: true },
    { x: 68, y: 110, w: 32, h: 130, r: 12, c: true },
    { x: 0, y: 258, w: 32, h: 130, r: 12, c: true },
    { x: 34, y: 258, w: 32, h: 130, r: 12, c: true },
    { x: 68, y: 258, w: 32, h: 130, r: 12, c: true },
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
