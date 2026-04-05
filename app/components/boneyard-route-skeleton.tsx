"use client";

import { Skeleton } from "boneyard-js/react";
import {
  getBoneyardFixture,
  type BoneyardSkeletonName,
} from "@/app/components/boneyard-fixtures";

type BoneyardRouteSkeletonProps = {
  name: BoneyardSkeletonName;
  minHeight: string;
};

export function BoneyardRouteSkeleton({
  name,
  minHeight,
}: BoneyardRouteSkeletonProps) {
  const fixture = getBoneyardFixture(name);

  return (
    <main className="flex min-h-screen flex-1 px-5 py-6 md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-5xl">
        <Skeleton
          name={name}
          loading
          fixture={fixture}
          fallback={fixture}
          className="w-full"
        >
          <div className="w-full" style={{ minHeight }} />
        </Skeleton>
      </div>
    </main>
  );
}
