"use client";

import { useState, useTransition } from "react";
import { sendContactMessage } from "@/actions/contact";

interface Labels {
  name: string;
  email: string;
  topic: string;
  message: string;
  submit: string;
  submitting: string;
  success: string;
  error: string;
  emailDirect: string;
}

export function ContactForm({
  locale,
  labels,
  topicOptions,
}: {
  locale: string;
  labels: Labels;
  topicOptions: { value: string; label: string }[];
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState(topicOptions[0]?.value ?? "general");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await sendContactMessage({
        name,
        email,
        topic,
        message,
        locale,
      });
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setName("");
        setEmail("");
        setMessage("");
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="contact-name"
            className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            {labels.name}
          </label>
          <input
            id="contact-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label
            htmlFor="contact-email"
            className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            {labels.email}
          </label>
          <input
            id="contact-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="contact-topic"
          className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
        >
          {labels.topic}
        </label>
        <select
          id="contact-topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {topicOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="contact-message"
          className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
        >
          {labels.message}
        </label>
        <textarea
          id="contact-message"
          required
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={5000}
          className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      {success && (
        <p className="rounded-md bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
          {labels.success}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {isPending ? labels.submitting : labels.submit}
        </button>
        <a
          href="mailto:info@dbc-germany.com"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          {labels.emailDirect}
        </a>
      </div>
    </form>
  );
}
