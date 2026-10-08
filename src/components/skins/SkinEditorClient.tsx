"use client";

import dynamic from "next/dynamic";

const SkinEditor = dynamic(
  () => import("@/components/skins/SkinEditor").then((m) => m.SkinEditor),
  {
    ssr: false,
    loading: () => (
      <div className="mc-frame flex min-h-[28rem] items-center justify-center p-6 text-sm text-[var(--mc-ink-subtle)]">
        Завантаження редактора…
      </div>
    ),
  },
);

export function SkinEditorClient() {
  return <SkinEditor />;
}
