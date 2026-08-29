import type { Metadata } from "next";

import { buildLcPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildLcPageMetadata({
  title: "Пропозиції гравців — Lost Chronicles Minecraft",
  description:
    "Голосуй за ідеї гравців українського Minecraft-сервера Lost Chronicles. Пропозиції змін правил, механік і подій.",
  path: "/proposals",
});

/** Перегляд пропозицій — публічний; голосування / створення — з авторизацією. */
export default function ProposalsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
