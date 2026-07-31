import type { Metadata } from "next";
import { AdminPanelClient } from "./admin-panel-client";

export const metadata: Metadata = {
  title: "Керування сайтом",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AdminPage() {
  return <AdminPanelClient />;
}
