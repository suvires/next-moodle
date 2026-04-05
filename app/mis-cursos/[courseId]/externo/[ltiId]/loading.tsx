"use client";

import { Skeleton } from "boneyard-js/react";

const pageBones = {
  name: "lti-detail",
  viewportWidth: 1440,
  width: 100,
  height: 400,
  bones: [
    // topbar area
    { x: 0, y: 0, w: 100, h: 50, r: 12, c: true },
    // heading area
    { x: 0, y: 70, w: 40, h: 20, r: 8 },
    // external tool embed area
    { x: 0, y: 110, w: 100, h: 260, r: 12, c: true },
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
          <div className="min-h-[400px] w-full" />
        </Skeleton>
      </div>
    </main>
  );
}
