/**
 * Resolve the right anchor target for an event card.
 *
 * DBC Germany events route into our checkout flow (internal href, same tab).
 * "Other"-branch events open the foreign branch's URL in a new tab so the
 * visitor doesn't lose our context.
 *
 * Used by every public event card (site homepage strip, site /events
 * archive, tickets listing) so the branching rule lives in exactly one
 * place.
 *
 * `event_branch` type is inlined here to keep @dbc/ui free of a hard
 * dependency on @dbc/types. The canonical SSOT is EVENT_BRANCH_VALUES
 * in packages/types/src/index.ts — keep these in sync.
 */
export interface EventLinkInput {
  event_branch: "dbc_germany" | "other";
  external_url: string | null;
}

export interface ResolvedEventLink {
  href: string;
  target: "_blank" | undefined;
  rel: "noopener noreferrer" | undefined;
  isExternal: boolean;
}

export function resolveEventLink(
  event: EventLinkInput,
  internalHref: string
): ResolvedEventLink {
  if (event.event_branch === "other" && event.external_url) {
    return {
      href: event.external_url,
      target: "_blank",
      rel: "noopener noreferrer",
      isExternal: true,
    };
  }
  return {
    href: internalHref,
    target: undefined,
    rel: undefined,
    isExternal: false,
  };
}
