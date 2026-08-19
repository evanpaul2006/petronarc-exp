"use client";

import type { ReactNode } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

/** Created once per browser session; absent until a deployment is configured. */
const convexClient = convexUrl ? new ConvexReactClient(convexUrl) : null;

/**
 * Wraps the app in a Convex provider when NEXT_PUBLIC_CONVEX_URL is set.
 * Without it the app renders unchanged and the ledger stays on localStorage.
 */
export function ConvexClientProvider({ children }: { children: ReactNode }) {
  if (!convexClient) return <>{children}</>;
  return <ConvexProvider client={convexClient}>{children}</ConvexProvider>;
}
