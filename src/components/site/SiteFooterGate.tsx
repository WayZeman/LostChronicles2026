"use client";

import { usePathname } from "next/navigation";

type Props = {
  children: React.ReactNode;
};

/** На /map футер приховано — повноекранна мапа над нижньою панеллю. */
export function SiteFooterGate({ children }: Props) {
  const pathname = usePathname() ?? "";
  if (pathname === "/map") return null;
  return children;
}
