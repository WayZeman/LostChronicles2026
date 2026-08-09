import { WikiEditClient } from "@/components/wiki/WikiEditClient";

export const dynamic = "force-dynamic";

export default function WikiNewPage() {
  return <WikiEditClient mode="create" />;
}
