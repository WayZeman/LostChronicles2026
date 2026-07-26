import { redirect } from "next/navigation";
import {
  authRequiredPath,
  getSessionUserIdFromCookies,
} from "@/lib/auth-session";

/** Перегляд пропозицій — лише для авторизованих (Discord). */
export default async function ProposalsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await getSessionUserIdFromCookies();
  if (!userId) {
    redirect(authRequiredPath("/proposals"));
  }
  return children;
}
