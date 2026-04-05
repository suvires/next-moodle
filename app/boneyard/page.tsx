import { notFound } from "next/navigation";
import { BoneyardCaptureClient } from "./capture-client";

export default function BoneyardCapturePage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return <BoneyardCaptureClient />;
}
