"use client";

import { useState } from "react";
import { deleteEvent } from "@/actions/events";

export function DeleteEventButton({
  eventId,
  eventTitle,
  locale,
}: {
  eventId: string;
  eventTitle: string;
  locale: string;
}) {
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!showConfirm) {
    return (
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="mt-4 rounded-md border border-danger-border px-4 py-2 text-sm font-medium text-danger hover:bg-danger-soft"
      >
        Delete event
      </button>
    );
  }

  const canDelete = confirmText.trim() === eventTitle.trim();

  return (
    <div className="mt-4 space-y-3">
      <p className="text-sm text-danger">
        Type the event title <strong>{eventTitle}</strong> to confirm deletion.
        This cannot be undone.
      </p>
      <input
        type="text"
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        placeholder={eventTitle}
        className="w-full max-w-md rounded-md border border-danger-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-danger-border"
        autoFocus
      />
      <div className="flex gap-2">
        <button
          type="button"
          disabled={!canDelete || isDeleting}
          onClick={async () => {
            setIsDeleting(true);
            await deleteEvent(eventId, locale);
          }}
          className="rounded-md bg-danger-strong px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isDeleting ? "Deleting..." : "Permanently delete"}
        </button>
        <button
          type="button"
          onClick={() => {
            setShowConfirm(false);
            setConfirmText("");
          }}
          disabled={isDeleting}
          className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
