/** Спільна оболонка для панелей Java / Bedrock на головній */
export const heroPanelShellClass =
  "am-glass flex h-full w-full min-h-[280px] flex-col items-center rounded-[1.35rem] p-6 text-center md:min-h-[300px] md:p-8";

/** Всередині lc-glass-panel — легка вкладена картка без подвійного am-glass */
export const heroPanelEmbeddedClass =
  "flex h-full w-full min-h-[260px] flex-col items-center rounded-[1.25rem] border border-white/[0.14] bg-[color-mix(in_srgb,#000_22%,transparent)] p-6 text-center shadow-[0_12px_40px_rgba(0,0,0,0.2)] backdrop-blur-[36px] backdrop-saturate-[1.75] md:min-h-[280px] md:p-8";
