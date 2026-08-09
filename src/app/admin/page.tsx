import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminPanelClient } from "./admin-panel-client";

export const metadata: Metadata = {
  title: "Керування сайтом",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <main className="site-container mx-auto w-full max-w-3xl px-3 py-12 text-sm text-[var(--mc-text-muted)]">
          Завантаження…
        </main>
      }
    >
      <AdminPanelClient />
    </Suspense>
  );
}
