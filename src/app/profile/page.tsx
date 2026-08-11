import type { Metadata } from "next";
import { ProfilePageClient } from "@/components/site/ProfilePageClient";

export const metadata: Metadata = {
  title: "Профіль",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function ProfilePage() {
  return <ProfilePageClient />;
}
