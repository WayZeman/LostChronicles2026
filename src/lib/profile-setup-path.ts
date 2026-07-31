import { sanitizeOAuthNextPath } from "@/lib/auth-paths";

/** Шлях онбордингу ніку з безпечним next=. */
export function profileSetupPath(nextPath: string): string {
  const safe = sanitizeOAuthNextPath(nextPath) ?? "/";
  return `/profile/setup?next=${encodeURIComponent(safe)}`;
}
