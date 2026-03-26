export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-20 mt-auto border-t border-[var(--mc-footer-border)] bg-[var(--mc-footer-bg)] pb-[calc(4.25rem+env(safe-area-inset-bottom,0px))]">
      <div className="site-container mx-auto flex w-full max-w-4xl justify-center px-4 py-8">
        <p className="text-center text-[11px] font-bold tracking-wide text-[var(--mc-footer-text)]">
          © {year} Lost Chronicles
        </p>
      </div>
    </footer>
  );
}
