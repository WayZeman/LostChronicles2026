import { redirect } from "next/navigation";
import {
  authRequiredPath,
  getSessionUserIdFromCookies,
} from "@/lib/auth-session";
import "./wiki-mirror.css";

/** Перегляд вікі — лише для авторизованих (Discord). */
export default async function WikiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await getSessionUserIdFromCookies();
  if (!userId) {
    redirect(authRequiredPath("/wiki"));
  }
  return children;
}
