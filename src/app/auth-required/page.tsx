import { AuthRequiredPanel } from "@/components/site/AuthRequiredPanel";
import { lcPageMainClass } from "@/components/site/lc-page-shell";
import {
  getSessionUserIdFromCookies,
  sanitizeOAuthNextPath,
} from "@/lib/auth-session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ next?: string; error?: string }>;
};

function contentLabelFor(path: string): string {
  if (path.startsWith("/wiki")) return "вікі";
  if (path.startsWith("/proposals")) return "пропозиції та голосування";
  if (path.startsWith("/apply")) return "анкету на сервер";
  return "цей вміст";
}

export default async function AuthRequiredPage({ searchParams }: Props) {
  const userId = await getSessionUserIdFromCookies();
  const sp = await searchParams;
  const nextPath = sanitizeOAuthNextPath(sp.next) ?? "/";

  if (userId) {
    redirect(nextPath);
  }

  return (
    <main className={lcPageMainClass}>
      <div className="site-container mx-auto flex w-full max-w-2xl flex-1 items-center px-4 py-12 md:py-16">
        <AuthRequiredPanel
          nextPath={nextPath}
          contentLabel={contentLabelFor(nextPath)}
          errorCode={sp.error ?? null}
        />
      </div>
    </main>
  );
}
