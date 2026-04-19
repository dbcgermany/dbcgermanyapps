"use client";

import { usePathname } from "next/navigation";
import { PageTransition } from "@dbc/ui";

const LEGAL_SEGMENTS = [
  "/imprint",
  "/privacy",
  "/terms",
  "/cookies",
  "/us-privacy-notice",
];

function isLegalPath(pathname: string) {
  return LEGAL_SEGMENTS.some(
    (seg) => pathname.endsWith(seg) || pathname.includes(`${seg}/`)
  );
}

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  return (
    <PageTransition disabled={isLegalPath(pathname)}>{children}</PageTransition>
  );
}
