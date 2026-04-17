/**
 * Formal salutation engine for invitation emails.
 *
 * Supports DE (formal Sie), FR (formal Vous), and EN (formal).
 * Handles gender, academic/professional titles, and graceful fallbacks.
 */

type Locale = "en" | "de" | "fr";
type Gender = "female" | "male" | "diverse" | null | undefined;

/**
 * Normalize raw title tokens into display forms.
 * "dr" → "Dr.", "prof" → "Prof.", "mrs" → "Mrs.", etc.
 */
function normalizeTitle(
  raw: string | null | undefined
): string | null {
  if (!raw) return null;
  const lower = raw.trim().toLowerCase();
  if (!lower) return null;

  switch (lower) {
    case "dr":
    case "dr.":
      return "Dr.";
    case "prof":
    case "prof.":
      return "Prof.";
    case "mr":
    case "mr.":
      return "Mr.";
    case "mrs":
    case "mrs.":
      return "Mrs.";
    case "ms":
    case "ms.":
      return "Ms.";
    default:
      // Custom title — return trimmed original (preserving case)
      return raw.trim();
  }
}

/**
 * Build a formal salutation line appropriate for invitation emails.
 *
 * @param locale  - 'en' | 'de' | 'fr'
 * @param gender  - 'female' | 'male' | 'diverse' | null | undefined
 * @param title   - 'mr', 'mrs', 'ms', 'dr', 'prof', or a custom string
 * @param lastName  - Surname; may be null/undefined
 * @param firstName - Given name (always required as fallback)
 */
export function formalSalutation(
  locale: Locale,
  gender: Gender,
  title: string | null | undefined,
  lastName: string | null | undefined,
  firstName: string
): string {
  const normalized = normalizeTitle(title);
  const last = lastName?.trim() || null;
  const first = firstName?.trim() || "";

  // Determine effective name to use (prefer last name, fall back to first)
  const name = last || first;

  switch (locale) {
    case "de":
      return germanSalutation(gender, normalized, name, last);
    case "fr":
      return frenchSalutation(gender, normalized, name, last);
    case "en":
    default:
      return englishSalutation(gender, normalized, name, last, first);
  }
}

// ---------------------------------------------------------------------------
// German — formal "Sie"
// ---------------------------------------------------------------------------

function germanSalutation(
  gender: Gender,
  title: string | null,
  name: string,
  lastName: string | null
): string {
  if (gender === "male") {
    const titlePart = buildGermanTitlePart(title);
    return `Sehr geehrter Herr ${titlePart}${name}`;
  }

  if (gender === "female") {
    const titlePart = buildGermanTitlePart(title);
    return `Sehr geehrte Frau ${titlePart}${name}`;
  }

  // diverse / unknown
  if (lastName || name) {
    return `Guten Tag ${name}`;
  }
  return "Guten Tag";
}

function buildGermanTitlePart(title: string | null): string {
  if (!title) return "";
  // Mr./Mrs./Ms. are handled by Herr/Frau already — only pass through
  // academic titles like Dr., Prof., or custom
  if (title === "Mr." || title === "Mrs." || title === "Ms.") return "";
  return `${title} `;
}

// ---------------------------------------------------------------------------
// French — formal "Vous"
// ---------------------------------------------------------------------------

function frenchSalutation(
  gender: Gender,
  title: string | null,
  name: string,
  lastName: string | null
): string {
  if (gender === "male") {
    if (title === "Dr.") {
      return lastName ? `Cher Docteur ${name}` : `Cher Docteur`;
    }
    if (title === "Prof.") {
      return lastName ? `Cher Professeur ${name}` : `Cher Professeur`;
    }
    return `Cher Monsieur ${name}`;
  }

  if (gender === "female") {
    if (title === "Dr.") {
      return lastName ? `Chère Docteure ${name}` : `Chère Docteure`;
    }
    if (title === "Prof.") {
      return lastName ? `Chère Professeure ${name}` : `Chère Professeure`;
    }
    return `Chère Madame ${name}`;
  }

  // diverse / unknown
  return "Madame, Monsieur";
}

// ---------------------------------------------------------------------------
// English — formal
// ---------------------------------------------------------------------------

function englishSalutation(
  gender: Gender,
  title: string | null,
  name: string,
  lastName: string | null,
  firstName: string
): string {
  if (gender === "male") {
    if (title === "Dr." || title === "Prof.") {
      return `Dear ${title} ${name}`;
    }
    return `Dear Mr. ${name}`;
  }

  if (gender === "female") {
    if (title === "Dr." || title === "Prof.") {
      return `Dear ${title} ${name}`;
    }
    if (title === "Mrs.") {
      return `Dear Mrs. ${name}`;
    }
    return `Dear Ms. ${name}`;
  }

  // diverse / unknown
  if (firstName) {
    return `Dear ${firstName}`;
  }
  return "Dear Sir or Madam";
}

// ---------------------------------------------------------------------------
// Formal closings
// ---------------------------------------------------------------------------

/**
 * Returns a locale-appropriate formal closing for invitation emails.
 */
export function formalClosing(locale: Locale): string {
  switch (locale) {
    case "de":
      return "Mit freundlichen Grüßen";
    case "fr":
      return "Cordialement";
    case "en":
    default:
      return "Kind regards";
  }
}
