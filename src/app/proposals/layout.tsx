import { redirect } from "next/navigation";
import {
  discordLoginPath,
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
    redirect(discordLoginPath("/proposals"));
  }
  return children;
}
