type Props = {
  children: React.ReactNode;
};

/** Скляна картка навколо вмісту вікі / новин (без дубльованого заголовка). */
export function WikiContentFrame({ children }: Props) {
  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="am-glass rounded-sm border-2 border-[var(--mc-border-card)] shadow-[0_4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.45)]">
        <div className="px-5 py-8 md:px-10 md:py-10">{children}</div>
      </div>
    </div>
  );
}
