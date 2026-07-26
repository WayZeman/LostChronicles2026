/** Спільна оболонка для панелей Java / Bedrock на головній */
export const heroPanelShellClass =
  "lc-hero-subpanel am-glass flex h-full w-full min-h-[280px] flex-col items-center rounded-[var(--radius)] p-6 text-center md:min-h-[300px] md:p-8";

/** Всередині lc-glass-panel — вкладена картка без blur */
export const heroPanelEmbeddedClass =
  "lc-hero-subpanel flex h-full w-full min-h-[260px] flex-col items-center rounded-[var(--radius)] border-2 border-[var(--mc-border-card)] bg-[var(--mc-deep)] p-6 text-center shadow-[0_1px_0_rgba(140,255,90,0.1)_inset,inset_0_-2px_0_rgba(0,0,0,0.45)] md:min-h-[280px] md:p-8";
