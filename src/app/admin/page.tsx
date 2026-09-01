import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { canEditWiki, isAdminRole } from "@/lib/admin-role";
import {
  authRequiredPath,
  getSessionUserIdFromCookies,
} from "@/lib/auth-session";
import { getUserPublicById } from "@/lib/proposals-queries";
import { AdminPanelClient } from "./admin-panel-client";

export const metadata: Metadata = {
  title: "Керування сайтом",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const userId = await getSessionUserIdFromCookies();
  if (!userId) {
    redirect(authRequiredPath("/admin"));
  }
  const user = await getUserPublicById(userId);
  if (!user || (!isAdminRole(user.role) && !canEditWiki(user.role))) {
    redirect("/");
  }

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
