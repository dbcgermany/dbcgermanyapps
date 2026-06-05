// Author classification (shown near the byline + used as an archive filter)
// and per-post author roles. Plain module (not "use server"), safe to export
// these const vocabularies for UI use.
export const AUTHOR_TYPES = [
  "coach",
  "expert",
  "journalist",
  "staff",
  "guest",
  "dbc_org",
] as const;
export type AuthorType = (typeof AUTHOR_TYPES)[number];

export const AUTHOR_ROLES = [
  "author",
  "co_author",
  "interviewer",
  "interviewee",
  "contributor",
] as const;
export type AuthorRole = (typeof AUTHOR_ROLES)[number];
