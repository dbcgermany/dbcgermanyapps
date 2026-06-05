import { StarterKit } from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Youtube from "@tiptap/extension-youtube";

/**
 * Single source of truth for the Tiptap schema, shared by every rich-text
 * editor (news body, newsletter, …). The schema only registers nodes/marks
 * that are inside the sanitizer allow-list (packages/legal sanitizeRichHtml),
 * so the editor cannot emit disallowed markup — write-time sanitize stays a
 * belt-and-suspenders no-op rather than a content-destroyer.
 */
export const EDITOR_EXTENSIONS = [
  StarterKit.configure({
    heading: { levels: [2, 3] },
    // StarterKit v3 bundles Link + Underline; disable them here and add
    // explicitly-configured versions below (avoids duplicate-extension error).
    link: false,
    underline: false,
  }),
  Underline,
  Link.configure({
    openOnClick: false,
    autolink: true,
    // Internal links keep no target; external links are set with target/rel
    // at insertion time by the link tool.
    HTMLAttributes: { rel: "noopener" },
  }),
  Image.configure({ HTMLAttributes: { loading: "lazy" } }),
  Youtube.configure({ nocookie: true, HTMLAttributes: { loading: "lazy" } }),
];
