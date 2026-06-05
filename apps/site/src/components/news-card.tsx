import Link from "next/link";
import Image from "next/image";
import { Badge } from "@dbc/ui";

export type NewsCardData = {
  slug: string;
  title: string;
  excerpt: string;
  cover: string;
  dateLabel: string | null;
  author: string | null;
  category: { slug: string; name: string } | null;
};

/**
 * SSOT article card, shared by the /news index, category landing pages and
 * author pages. Token-only styling; mobile-first (full-width on small,
 * 2-col on md via the parent grid).
 */
export function NewsCard({ locale, post }: { locale: string; post: NewsCardData }) {
  return (
    <Link
      href={`/${locale}/news/${post.slug}`}
      className="group block h-full overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        <Image
          src={post.cover}
          alt={post.title}
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover transition-transform group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="p-6">
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {post.category && <Badge variant="accent">{post.category.name}</Badge>}
          {post.dateLabel && <span>{post.dateLabel}</span>}
        </div>
        <h2 className="mt-2 font-heading text-xl font-bold group-hover:text-primary">
          {post.title}
        </h2>
        {post.excerpt && (
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
            {post.excerpt}
          </p>
        )}
        {post.author && (
          <p className="mt-4 text-xs text-muted-foreground">{post.author}</p>
        )}
      </div>
    </Link>
  );
}
