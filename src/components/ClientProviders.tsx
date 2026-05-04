"use client";

import { ReactNode, Suspense } from "react";
import { SessionProvider } from "@/context/SessionContext";

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SessionProvider>
        {children}
      </SessionProvider>
    </Suspense>
  );
}
