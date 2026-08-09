import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  MessageCircle,
  Pencil,
} from "lucide-react";
import type { WikiSocialLink } from "@/lib/wiki-structure";
import { WikiMirrorHtml } from "@/components/wiki/WikiMirrorHtml";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  slug: string;
  html: string;
  summary?: string;
  socialLinks?: WikiSocialLink[];
  canEdit?: boolean;
  backHref?: string;
  backLabel?: string;
};

function SocialIcon({ kind }: { kind: WikiSocialLink["kind"] }) {
  if (kind === "telegram" || kind === "discord" || kind === "youtube") {
    return <MessageCircle className="size-3.5" aria-hidden />;
  }
  return <ExternalLink className="size-3.5" aria-hidden />;
}

export function WikiArticleView({
  title,
  slug,
  html,
  summary,
  socialLinks = [],
  canEdit,
  backHref = "/wiki",
  backLabel = "Головна вікі",
}: Props) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={backHref}
          className="lc-focus-ring inline-flex items-center gap-2 text-sm font-bold text-[var(--mc-text-muted)] hover:text-[var(--mc-net-green)]"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {backLabel}
        </Link>
        {canEdit ? (
          <Link
            href={`/wiki/${encodeURIComponent(slug)}/edit`}
            className="lc-focus-ring inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-bold text-[var(--mc-text)]"
          >
            <Pencil className="size-3.5" aria-hidden />
            Редагувати
          </Link>
        ) : null}
      </div>

      <header className="space-y-2 border-b border-white/10 pb-4">
        <h1 className="text-2xl font-black text-[var(--mc-text)] sm:text-3xl">
          {title}
        </h1>
        {summary ? (
          <p className="text-sm text-[var(--mc-text-muted)]">{summary}</p>
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
                  "lc-focus-ring inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-black/30 px-2.5 py-1.5 text-xs font-bold text-[var(--mc-text)]",
                  "hover:border-[var(--mc-net-green)]/40 hover:text-[var(--mc-net-green)]",
                )}
              >
                <SocialIcon kind={s.kind} />
                {s.label}
              </a>
            ))}
          </div>
        ) : null}
      </header>

      <WikiMirrorHtml html={html} rewriteWikiLinksToLocal />
    </div>
  );
}
