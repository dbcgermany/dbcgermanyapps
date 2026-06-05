"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

const PILL =
  "rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground hover:border-foreground/40";

export function ShareButtons({ url, title }: { url: string; title: string }) {
  const t = useTranslations("site.news");
  const [copied, setCopied] = useState(false);
  const enc = encodeURIComponent;
  const links = [
    { label: "X", href: `https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(title)}` },
    { label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}` },
    { label: "WhatsApp", href: `https://wa.me/?text=${enc(`${title} ${url}`)}` },
  ];

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked */
    }
  }

  return (
    <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-border pt-6">
      <span className="text-sm font-medium">{t("share")}</span>
      {links.map((l) => (
        <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className={PILL}>
          {l.label}
        </a>
      ))}
      <button type="button" onClick={copy} className={PILL}>
        {copied ? t("linkCopied") : t("copyLink")}
      </button>
    </div>
  );
}
