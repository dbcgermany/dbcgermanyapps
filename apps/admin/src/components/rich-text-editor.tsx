"use client";

import { useRef, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Unlink,
  Image as ImageIcon,
  Video as VideoIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { cn } from "@dbc/ui";
import { EDITOR_EXTENSIONS } from "@/lib/editor-extensions";
import { uploadEventCover } from "@/actions/events";

/**
 * Visual (WYSIWYG) editor for rich-HTML bodies — built so non-technical
 * authors never touch HTML. Outputs HTML constrained to the sanitizer
 * allow-list (see editor-extensions). Form integration is a hidden input
 * named `name`, synced from editor.getHTML(), so the existing server-action
 * contract (formData.get(name)) is unchanged.
 */
export function RichTextEditor({
  name,
  defaultValue = "",
}: {
  name: string;
  defaultValue?: string;
}) {
  const t = useTranslations("admin.news.editor.toolbar");
  const [html, setHtml] = useState(defaultValue);
  const fileRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: EDITOR_EXTENSIONS,
    content: defaultValue,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-neutral dark:prose-invert max-w-none min-h-[16rem] px-4 py-3 focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => setHtml(editor.getHTML()),
  });

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !editor) return;
    const fd = new FormData();
    fd.set("file", file);
    const res = await uploadEventCover(fd);
    if ("error" in res) {
      toast.error(res.error);
      return;
    }
    editor.chain().focus().setImage({ src: res.url, alt: file.name }).run();
  }

  function addLink() {
    if (!editor) return;
    const url = window.prompt(t("linkPrompt"))?.trim();
    if (url === undefined) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const external = /^https?:\/\//.test(url);
    editor
      .chain()
      .focus()
      .setLink({
        href: url,
        target: external ? "_blank" : null,
        rel: external ? "noopener noreferrer" : null,
      })
      .run();
  }

  function addVideo() {
    if (!editor) return;
    const url = window.prompt(t("videoPrompt"))?.trim();
    if (!url) return;
    editor.commands.setYoutubeVideo({ src: url });
  }

  return (
    <div className="rounded-md border border-input bg-background">
      <input type="hidden" name={name} value={html} />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onPickImage}
      />
      {editor && (
        <div className="flex flex-wrap items-center gap-0.5 border-b border-border p-1.5">
          <Tb editor={editor} on={() => editor.chain().focus().toggleBold().run()} active="bold" label={t("bold")}><Bold className="h-4 w-4" /></Tb>
          <Tb editor={editor} on={() => editor.chain().focus().toggleItalic().run()} active="italic" label={t("italic")}><Italic className="h-4 w-4" /></Tb>
          <Tb editor={editor} on={() => editor.chain().focus().toggleUnderline().run()} active="underline" label={t("underline")}><UnderlineIcon className="h-4 w-4" /></Tb>
          <Divider />
          <Tb editor={editor} on={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active="heading" activeAttrs={{ level: 2 }} label={t("h2")}><Heading2 className="h-4 w-4" /></Tb>
          <Tb editor={editor} on={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active="heading" activeAttrs={{ level: 3 }} label={t("h3")}><Heading3 className="h-4 w-4" /></Tb>
          <Tb editor={editor} on={() => editor.chain().focus().toggleBulletList().run()} active="bulletList" label={t("bulletList")}><List className="h-4 w-4" /></Tb>
          <Tb editor={editor} on={() => editor.chain().focus().toggleOrderedList().run()} active="orderedList" label={t("orderedList")}><ListOrdered className="h-4 w-4" /></Tb>
          <Tb editor={editor} on={() => editor.chain().focus().toggleBlockquote().run()} active="blockquote" label={t("quote")}><Quote className="h-4 w-4" /></Tb>
          <Divider />
          <Tb editor={editor} on={addLink} active="link" label={t("link")}><LinkIcon className="h-4 w-4" /></Tb>
          <Tb editor={editor} on={() => editor.chain().focus().unsetLink().run()} label={t("unlink")}><Unlink className="h-4 w-4" /></Tb>
          <Tb editor={editor} on={() => fileRef.current?.click()} label={t("image")}><ImageIcon className="h-4 w-4" /></Tb>
          <Tb editor={editor} on={addVideo} label={t("video")}><VideoIcon className="h-4 w-4" /></Tb>
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-border" aria-hidden />;
}

function Tb({
  editor,
  on,
  active,
  activeAttrs,
  label,
  children,
}: {
  editor: Editor;
  on: () => void;
  active?: string;
  activeAttrs?: Record<string, unknown>;
  label: string;
  children: React.ReactNode;
}) {
  const isActive = active ? editor.isActive(active, activeAttrs) : false;
  return (
    <button
      type="button"
      onClick={on}
      title={label}
      aria-label={label}
      className={cn(
        "rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        isActive && "bg-muted text-foreground"
      )}
    >
      {children}
    </button>
  );
}
