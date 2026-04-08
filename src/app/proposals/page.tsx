import { Suspense } from "react";
import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";
import { lcPageMainClass } from "@/components/site/lc-page-shell";
import { ProposalsListClient } from "./proposals-list-client";
import { cn } from "@/lib/utils";

function ProposalsListFallback() {
  return (
    <main className={lcPageMainClass}>
      <div className="site-container mx-auto max-w-4xl px-4 py-8">
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className={cn(lcGlassPanelClass, "h-36 animate-pulse")} />
          ))}
        </div>
      </div>
    </main>
  );
}

export default function ProposalsPage() {
  return (
    <Suspense fallback={<ProposalsListFallback />}>
      <ProposalsListClient />
    </Suspense>
  );
}
