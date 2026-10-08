import type { Metadata } from "next";
import { SkinEditorClient } from "@/components/skins/SkinEditorClient";
import { buildLcPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildLcPageMetadata({
  title: "Створити скін",
  description:
    "Повноекранний 3D-редактор Minecraft-скінів Lost Chronicles: частини тіла, пікселі, пози та збереження.",
  path: "/skins/new",
  index: false,
});

export default function NewSkinPage() {
  return <SkinEditorClient />;
}
