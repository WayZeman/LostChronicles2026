import Link from "next/link";
import { ArrowLeft, ExternalLink, MessageCircle } from "lucide-react";
import type { WikiSocialLink } from "@/lib/wiki-structure";
import { SoftAppear } from "@/components/site/SoftAppear";
import { WikiMirrorHtml } from "@/components/wiki/WikiMirrorHtml";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Props = {
  title: string;
  slug: string;
  html: string;
  summary?: string;
  socialLinks?: WikiSocialLink[];
  backHref?: string;
  backLabel?: string;
  editMode?: boolean;
  onBack?: () => void;
  headerActions?: ReactNode;
};

function SocialIcon({ kind }: { kind: WikiSocialLink["kind"] }) {
  if (kind === "telegram" || kind === "discord" || kind === "youtube") {
    return <MessageCircle className="size-3.5" aria-hidden />;
  }
  return <ExternalLink className="size-3.5" aria-hidden />;
}

export function WikiArticleView({
  title,
  html,
  summary,
  socialLinks = [],
  backHref = "/wiki",
  backLabel = "Вікі світу",
  editMode,
  onBack,
  headerActions,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {editMode && onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="lc-focus-ring inline-flex items-center gap-2 text-sm font-bold text-[var(--mc-text-muted)] hover:text-[var(--mc-net-green)]"
          >
            <ArrowLeft className="size-4" aria-hidden />
            {backLabel}
          </button>
        ) : (
          <Link
            href={backHref}
            className="lc-focus-ring inline-flex items-center gap-2 text-sm font-bold text-[var(--mc-text-muted)] hover:text-[var(--mc-net-green)]"
          >
            <ArrowLeft className="size-4" aria-hidden />
            {backLabel}
          </Link>
        )}
        {headerActions}
      </div>

      <SoftAppear>
        <header className="relative space-y-3 border-b border-white/10 pb-5">
          <h1 className="lc-hero-title text-2xl text-[var(--mc-text)] sm:text-3xl md:text-4xl">
            {title}
          </h1>
          {summary ? (
            <p className="max-w-2xl text-sm leading-relaxed text-[var(--mc-text-muted)]">
              {summary}
            </p>
          ) : null}
          {socialLinks.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {socialLinks.map((s) => (
                <a
                  key={`${s.kind}-${s.url}`}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "lc-focus-ring inline-flex items-center gap-1.5 border border-white/15 bg-black/35 px-2.5 py-1.5 text-xs font-bold text-[var(--mc-text)]",
                    "transition hover:border-[var(--mc-net-green)]/45 hover:text-[var(--mc-net-green)]",
                  )}
                >
                  <SocialIcon kind={s.kind} />
                  {s.label}
                </a>
              ))}
            </div>
          ) : null}
        </header>
      </SoftAppear>

      <SoftAppear slow>
        <div className="relative">
          <WikiMirrorHtml html={html} rewriteWikiLinksToLocal />
        </div>
      </SoftAppear>
    </div>
  );
}
