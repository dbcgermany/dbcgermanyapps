# DBC Germany — Single Source of Truth

> **Version:** 2026.04.10.1
> **Last updated:** 2026-04-10
> **Status:** Canonical
> **Owned by:** Engineering Leadership (Jay N Kalala)

**One truth, everywhere.** Every design value, string, business rule, data definition, and
calculation has exactly one authoritative source. All three apps — Tickets (Next.js), Admin
(Next.js), and Marketing Site (Framer) — are thin shells around those shared truths.

This document defines the complete SSOT architecture for the DBC Germany event ecosystem.
Violations are audit failures.

---

## Related Documents

| Document | Relationship |
|----------|-------------|
| Plan (`hashed-wandering-bee.md`) | Full architecture plan — schema, phases, verification |
| `packages/ui/tokens/` | Design token source files — visual identity SSOT |
| `packages/i18n/messages/en.json` | Authoritative i18n source — all UI strings |
| `packages/types/database.ts` | Generated TypeScript types from Supabase schema |
| `packages/supabase/` | Typed client, role guards, generated DB types |
| `packages/email/` | React Email templates — transactional email SSOT |
| `.env.example` | Environment variable registry per app |

---

## SSOT Domain Ownership

| Domain | Authoritative Source | Consumed By |
|--------|---------------------|-------------|
| Color palette, brand colors | `packages/ui/tokens/` | All apps, email templates |
| Font families, type scale | `packages/ui/tokens/` | All apps |
| Spacing, radius, shadow, motion | `packages/ui/tokens/base.tokens.json` | All apps |
| CSS variable naming | This file SS3 | Web (Tailwind + CSS) |
| Database schema, data shapes | PostgreSQL (Supabase Frankfurt) | All apps via generated types |
| Business logic, calculations | Server Actions + API Routes | All apps |
| UI strings (all languages) | `packages/i18n/messages/en.json` | All apps, email templates |
| Email templates | `packages/email/` | Tickets app, Admin app |
| Asset naming, logo variants | This file SS9 | All apps |
| Role permissions | `profiles.role` + Server Action guards | Admin app, Tickets app |
| Event content (trilingual) | Database (`title_en`, `title_de`, `title_fr`) | All apps |
| GDPR compliance | Server-side enforcement + legal pages | All apps |

---

## 1. Core Principle: One Truth, Everywhere

### Single-Tenant, 3-App Architecture

DBC Germany is a **single-tenant** event ecosystem. There is no multi-tenant isolation, no RLS,
no tenant_id columns. All database access is server-side via `service_role`. Role guards enforce
permissions in Server Actions.

```
┌─────────────────────────────────────────────────────┐
│                  SSOT Sources                       │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐ │
│  │  Tokens  │  │   i18n   │  │    Database        │ │
│  │  (JSON)  │  │  (JSON)  │  │  (PostgreSQL)      │ │
│  └────┬─────┘  └────┬─────┘  └────────┬──────────┘ │
│       │              │                 │             │
│       ▼              ▼                 ▼             │
│  ┌─────────────────────────────────────────────┐    │
│  │        Build / Generation Step              │    │
│  └──┬──────────────┬──────────────┬────────────┘    │
│     │              │              │                  │
│     ▼              ▼              ▼                  │
│  ┌────────┐  ┌──────────┐  ┌──────────────┐        │
│  │Tickets │  │  Admin   │  │ Marketing    │        │
│  │ App    │  │  App     │  │ Site (Framer)│        │
│  └────────┘  └──────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────┘
```

### Client = Thin Shell

Every client — Tickets app, Admin app, Marketing site — behaves as a **thin shell** that:

1. Renders UI
2. Sends intents (e.g., "buy ticket", "check in attendee")
3. Displays server results

The server decides everything. No client calculates prices, checks permissions, or modifies
inventory. The server is the authority.

### Two Repos, One Supabase

| Repo | Domain | Purpose |
|------|--------|---------|
| `dbcgermanysite` | `dbc-germany.com` | Marketing site (Framer). All DBC Germany services. |
| `dbcgermanyapps` | `ticket.dbc-germany.com` + `admin.dbc-germany.com` | Turborepo monorepo: ticketing + admin dashboard |

Both repos share a single Supabase instance in **Frankfurt** (EU data residency).

### Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 App Router |
| Hosting | Vercel (Frankfurt region) |
| Database | Supabase (PostgreSQL, Frankfurt) |
| Auth | Supabase Auth (magic link for buyers, password for staff) |
| Payments | Stripe (Cards + SEPA + PayPal) |
| Email | Resend + React Email |
| i18n | next-intl (EN, DE, FR) |
| UI | shadcn/ui + Tailwind CSS + DBC brand tokens |
| Monorepo | Turborepo + pnpm |
| Animation | Framer Motion (primary) + GSAP ScrollTrigger (complex scroll) |
| QR | html5-qrcode (scanner) + qrcode (generation) |
| PDF | @react-pdf/renderer |
| Anti-bot | Cloudflare Turnstile |

---

## 2. Design Token System

### Token Categories

| Category | Purpose | CSS Variable Pattern |
|----------|---------|---------------------|
| Color | All colors in the product | `--dbc-color-{name}` |
| Typography | Font families, sizes, weights, line heights | `--dbc-font-{role}`, `--dbc-text-{scale}` |
| Spacing | All whitespace and gaps | `--dbc-spacing-{scale}` |
| Radius | Border radii | `--dbc-radius-{size}` |
| Shadow | Box shadows | `--dbc-shadow-{size}` |
| Z-Index | Stacking layers | `--dbc-z-{layer}` |
| Motion | Animation duration and easing | `--dbc-duration-{speed}`, `--dbc-ease-{type}` |

### Token Package Location

```
packages/
  ui/
    tokens/                         <- SOURCE -- edit only these files
      base.tokens.json              <- spacing, type scale, radius, shadow, motion
      theme.light.tokens.json       <- light mode colors
      theme.dark.tokens.json        <- dark mode colors
    generated/                      <- BUILD OUTPUT -- never edit by hand
      base.css                      <- shared tokens (spacing, type, radius, shadow, motion)
      theme.light.css               <- light mode color variables
      theme.dark.css                <- dark mode color variables
      tailwind.tokens.ts            <- Tailwind theme extension
```

### Token File Responsibilities

| File | Mode Support | Defines |
|------|-------------|---------|
| `base.tokens.json` | Mode-independent | Spacing, type scale, radius, shadow, motion -- shared everywhere |
| `theme.light.tokens.json` | Light mode | All color tokens for light mode (default) |
| `theme.dark.tokens.json` | Dark mode | All color tokens for dark mode (`prefers-color-scheme: dark` + manual toggle) |

### Token Generation Pipeline

```
base.tokens.json ──────────────────────────────────┐
theme.light.tokens.json ───────────────────────────┤
theme.dark.tokens.json ────────────────────────────┤
                                                   │
                                    ▼  build step  │
┌─────────────────────────────────────────────────────┐
│ Web                                                 │
│ base.css          (spacing, type, radius, etc.)     │
│ theme.light.css   (light palette)                   │
│ theme.dark.css    (dark palette)                    │
│ tailwind.tokens.ts (Tailwind config)                │
└─────────────────────────────────────────────────────┘
```

### CSS Import Pattern (layout.tsx)

Each app's root layout imports the correct CSS files. Components never import theme CSS
directly -- they only see `var(--dbc-color-bg)` etc. and receive the correct value from
the cascade.

```
apps/tickets/src/app/layout.tsx   <- imports base.css + theme.light.css + theme.dark.css
apps/admin/src/app/layout.tsx     <- imports base.css + theme.light.css + theme.dark.css
```

### Two-Layer CSS Variable System

Each theme CSS file contains two synchronized sections:

**Layer 1 -- Semantic hex tokens** (`--dbc-color-*`)
Used by Tailwind semantic utility classes (`bg-dbc-bg`, `text-dbc-accent`, `border-dbc-border`).
These are the canonical values.

**Layer 2 -- shadcn HSL variables** (`--background`, `--primary`, `--border`, etc.)
Used internally by shadcn/ui atom components (Button, Input, Label, Badge).
shadcn uses the `hsl(var(--primary))` format, requiring values in `H S% L%` form.

Both layers must be kept in sync. The hex value is canonical; the HSL value is derived from it.

```css
/* theme.light.css -- generated, never edit directly */
:root {
  /* Layer 1: DBC hex tokens -- used by Tailwind classes */
  --dbc-color-bg:            #ffffff;
  --dbc-color-surface:       #fafafa;
  --dbc-color-primary:       #c8102e;
  --dbc-color-accent:        #d4a017;
  --dbc-color-text:          #111111;
  --dbc-color-border:        #e5e5e5;

  /* Layer 2: shadcn HSL variables -- derived from Layer 1 */
  --background:     0 0% 100%;        /* #ffffff */
  --primary:        350 85% 42%;      /* #c8102e DBC red */
  --accent:         43 78% 46%;       /* #d4a017 DBC gold */
  --border:         0 0% 90%;         /* #e5e5e5 */
  --ring:           350 85% 42%;      /* #c8102e -- focus ring matches primary */
}
```

**Rule:** When adding a new color token, add it to Layer 1 as `--dbc-color-*` hex, then
update the corresponding shadcn variable in Layer 2. Both theme files must be updated together.

### Rules

- **All visual values originate from token files** -- no exceptions
- Generated CSS files are **build output** -- never the source
- A token change = one JSON edit in the correct source file, then regenerate
- No hardcoded hex, font size, spacing number, or radius anywhere in any app's code
- When the OS preference or manual toggle switches themes, only CSS custom properties swap --
  no component logic changes
- `prefers-color-scheme` + manual toggle with `data-theme` attribute

---

## 3. Color System

### Brand Palette

The DBC Germany palette: **Red, White, Gold/Yellow** + neutral grays + 4 alert colors.
Derived from the DBC brand identity at diambilaybusinesscenter.org.

| Family | Role | Hex (Light) | Hex (Dark) |
|--------|------|-------------|------------|
| Red | Primary / brand | `#c8102e` | `#e63950` |
| Gold | Accent / CTA | `#d4a017` | `#f0c040` |
| White | Background | `#ffffff` | N/A |
| Black | Text / dark bg | `#111111` | N/A |
| Gray-50 | Lightest surface | `#fafafa` | `#1a1a1a` |
| Gray-100 | Surface | `#f5f5f5` | `#222222` |
| Gray-200 | Subtle border | `#e5e5e5` | `#333333` |
| Gray-300 | Border | `#d4d4d4` | `#444444` |
| Gray-400 | Muted text | `#a3a3a3` | `#666666` |
| Gray-500 | Secondary text | `#737373` | `#888888` |
| Gray-900 | Primary text | `#111111` | `#fafafa` |

### Semantic Color Tokens

Semantic tokens abstract raw palette values into **purpose-driven roles**. Components reference
these tokens -- never raw palette values directly.

| Semantic Token | CSS Variable | Light Mode | Dark Mode | Usage |
|----------------|-------------|------------|-----------|-------|
| Background | `--dbc-color-bg` | `#ffffff` | `#0a0a0a` | Main page background |
| Background secondary | `--dbc-color-bg-secondary` | `#fafafa` | `#141414` | Cards, sections |
| Background tertiary | `--dbc-color-bg-tertiary` | `#f5f5f5` | `#1e1e1e` | Hover, disabled surfaces |
| Surface | `--dbc-color-surface` | `#ffffff` | `#1a1a1a` | Elevated card surfaces |
| Surface raised | `--dbc-color-surface-raised` | `#fafafa` | `#222222` | Modals, popovers |
| Text primary | `--dbc-color-text` | `#111111` | `#fafafa` | Primary body text |
| Text secondary | `--dbc-color-text-secondary` | `#737373` | `#a3a3a3` | Labels, metadata |
| Text muted | `--dbc-color-text-muted` | `#a3a3a3` | `#666666` | Disabled, placeholder |
| Primary | `--dbc-color-primary` | `#c8102e` | `#e63950` | Brand red: CTAs, links, focus |
| Primary hover | `--dbc-color-primary-hover` | `#a00d24` | `#f05a70` | Hover state of primary |
| Accent | `--dbc-color-accent` | `#d4a017` | `#f0c040` | Gold: highlights, badges, VIP |
| Accent hover | `--dbc-color-accent-hover` | `#b88a12` | `#f5d060` | Hover state of accent |
| Border | `--dbc-color-border` | `#e5e5e5` | `#333333` | Default borders |
| Border subtle | `--dbc-color-border-subtle` | `#f0f0f0` | `#222222` | Subtle separators |
| Success | `--dbc-color-success` | `#10b981` | `#6ee7b7` | Check-in confirmed, payment success |
| Warning | `--dbc-color-warning` | `#f59e0b` | `#fbbf24` | Low inventory, expiring soon |
| Error | `--dbc-color-error` | `#ef4444` | `#f87171` | Validation errors, scan rejection |
| Info | `--dbc-color-info` | `#3b82f6` | `#60a5fa` | Informational toasts, badges |

### Theme Switching

| Mechanism | Details |
|-----------|---------|
| Default | System preference via `prefers-color-scheme` |
| Manual | Toggle in navbar stores preference in cookie + sets `data-theme` attribute |
| Persistence | Cookie (`dbc-theme`) + `data-theme` attribute on `<html>` |
| Admin app | Supports both light and dark (follows system + toggle) |
| Tickets app | Supports both light and dark (follows system + toggle) |

### Color Flow

```
Token JSON (hex values)  ->  Generated CSS (custom properties)
                                      |
                              ┌───────┤
                              ▼       ▼
                        CSS Layer 1   CSS Layer 2
                        (--dbc-*)     (shadcn HSL)
                              |       |
                              ▼       ▼
                        Tailwind      shadcn/ui
                        classes       components
                              |       |
                              ▼       ▼
                        Components reference
                        semantic tokens only
```

### Rules

- Components reference **semantic tokens** (`--dbc-color-bg`, `--dbc-color-text`, `--dbc-color-primary`) -- never raw palette values
- No raw hex values anywhere in component code -- tokens only
- Only colors from the red-gold-white-gray palette + 4 alert colors
- Alert colors are reserved for status communication only -- never decorative
- Alert colors have separate light and dark mode values -- both must be defined
- All grays are pure neutral -- no cool-toned (blue-gray, slate) grays
- WCAG 2.1 AA contrast ratios enforced: 4.5:1 for normal text, 3:1 for large text and UI elements
- Dark mode values are defined in `theme.dark.tokens.json` -- not duplicated in components

---

## 4. Typography System

### Font Families

| Role | Font | CSS Variable | Usage |
|------|------|-------------|-------|
| Heading | Montserrat | `--dbc-font-heading` | All headings (h1-h6), display text, hero text |
| Body | Ubuntu | `--dbc-font-body` | Body text, labels, captions, descriptions |
| UI | DM Sans | `--dbc-font-ui` | Buttons, inputs, badges, navigation, small UI text |

All three fonts loaded via `next/font` with `display: swap` (no FOUT/FOIT).

**Fallback stacks:**
```css
--dbc-font-heading: 'Montserrat', system-ui, -apple-system, sans-serif;
--dbc-font-body:    'Ubuntu', system-ui, -apple-system, sans-serif;
--dbc-font-ui:      'DM Sans', system-ui, -apple-system, sans-serif;
```

### Type Scale

| Token Name | Font | Size | Weight | Line Height | Letter Spacing | Usage |
|------------|------|------|--------|-------------|---------------|-------|
| `display-lg` | Heading | 48px | 800 | 1.1 | -0.02em | Hero headlines |
| `display` | Heading | 36px | 700 | 1.2 | -0.01em | Section display text |
| `heading-1` | Heading | 30px | 700 | 1.3 | -0.01em | Page titles |
| `heading-2` | Heading | 24px | 600 | 1.35 | 0 | Section headers |
| `heading-3` | Heading | 20px | 600 | 1.4 | 0 | Card titles, dialog titles |
| `heading-4` | Heading | 18px | 600 | 1.45 | 0 | Sub-section headers |
| `body-lg` | Body | 18px | 400 | 1.6 | 0 | Large body text, event descriptions |
| `body` | Body | 16px | 400 | 1.6 | 0 | Default body text |
| `body-sm` | Body | 14px | 400 | 1.5 | 0 | Secondary text, helper text |
| `caption` | Body | 12px | 500 | 1.4 | 0.01em | Timestamps, fine print, metadata |
| `label` | UI | 14px | 500 | 1.4 | 0.01em | Form labels, nav items, badges |
| `label-sm` | UI | 12px | 500 | 1.4 | 0.02em | Small labels, tag text |
| `button` | UI | 14px | 600 | 1.0 | 0.01em | Button text |
| `button-lg` | UI | 16px | 600 | 1.0 | 0 | Large button text |
| `code` | DM Sans Mono | 14px | 400 | 1.5 | 0 | Code, ticket tokens, order IDs |

All values defined in `base.tokens.json` and generated to CSS.

### Typography Atoms (Web)

Atoms consume tokens directly via CVA (class-variance-authority):

| Atom | HTML Element | Token Range | Purpose |
|------|-------------|-------------|---------|
| `Display` | `<h1>`, `<p>` | `display-lg`, `display` | Hero/marketing text |
| `Heading` | `<h1>`-`<h6>` | `heading-1`-`heading-4` | Section headers |
| `Text` | `<p>`, `<span>` | `body-lg`, `body`, `body-sm` | Body text, paragraphs |
| `FormLabel` | `<label>` | `label`, `label-sm` | Form/UI labels |
| `Caption` | `<span>`, `<p>` | `caption` | Helper text, metadata |

### Typography Flow

```
base.tokens.json (type scale)
    |
    ▼
Typography Tokens -> Typography Atoms -> Molecules / Components -> Pages
```

### Typography Colors

Typography colors use semantic CSS variables that swap with theme:

| Class | Maps To | Usage |
|-------|---------|-------|
| `text-dbc-text` | `--dbc-color-text` | Primary text |
| `text-dbc-text-secondary` | `--dbc-color-text-secondary` | Labels, metadata |
| `text-dbc-text-muted` | `--dbc-color-text-muted` | Disabled, placeholder |
| `text-dbc-primary` | `--dbc-color-primary` | Links, emphasis |
| `text-dbc-accent` | `--dbc-color-accent` | Gold highlights |
| `text-dbc-error` | `--dbc-color-error` | Validation errors |

### Rules

- Components NEVER define font sizes, weights, or line heights inline
- Pages NEVER override typography atom styling
- All typography resolves from tokens or presets
- New text contexts require new presets -- not one-off inline styles
- Montserrat is for headings and display text only -- never body text
- Ubuntu is for body text -- never headings
- DM Sans is for UI elements -- never headings or body paragraphs
- No more than 3 font weights per page (regular 400, medium 500, semibold/bold 600-800)
- No custom fonts beyond the three defined families

---

## 5. Spacing, Radius, Shadow, Z-Index, and Motion

### Spacing Scale

Base unit: **4px**. All spacing derives from this base.

| Token | Value | CSS Variable | Common Use |
|-------|-------|-------------|------------|
| `spacing-0` | 0px | `--dbc-spacing-0` | Reset |
| `spacing-0.5` | 2px | `--dbc-spacing-0-5` | Micro gaps |
| `spacing-1` | 4px | `--dbc-spacing-1` | Tight inline spacing |
| `spacing-1.5` | 6px | `--dbc-spacing-1-5` | Small padding |
| `spacing-2` | 8px | `--dbc-spacing-2` | Default inline spacing |
| `spacing-3` | 12px | `--dbc-spacing-3` | Default padding |
| `spacing-4` | 16px | `--dbc-spacing-4` | Standard card padding |
| `spacing-5` | 20px | `--dbc-spacing-5` | Section padding |
| `spacing-6` | 24px | `--dbc-spacing-6` | Card gaps |
| `spacing-8` | 32px | `--dbc-spacing-8` | Section gaps |
| `spacing-10` | 40px | `--dbc-spacing-10` | Large section gaps |
| `spacing-12` | 48px | `--dbc-spacing-12` | Page vertical rhythm |
| `spacing-16` | 64px | `--dbc-spacing-16` | Hero spacing |
| `spacing-20` | 80px | `--dbc-spacing-20` | Page top/bottom |
| `spacing-24` | 96px | `--dbc-spacing-24` | Largest spacing |

### Semantic Spacing Tokens

| Token | Value | Purpose |
|-------|-------|---------|
| `--dbc-spacing-page-x` | `--dbc-spacing-4` (mobile) / `--dbc-spacing-6` (desktop) | Horizontal page padding |
| `--dbc-spacing-page-y` | `--dbc-spacing-6` (mobile) / `--dbc-spacing-12` (desktop) | Vertical page padding |
| `--dbc-spacing-card-padding` | `--dbc-spacing-4` | Card internal padding |
| `--dbc-spacing-card-gap` | `--dbc-spacing-3` | Gap between elements inside a card |
| `--dbc-spacing-section-gap` | `--dbc-spacing-8` | Gap between page sections |
| `--dbc-spacing-form-gap` | `--dbc-spacing-4` | Gap between form fields |
| `--dbc-spacing-inline` | `--dbc-spacing-2` | Gap between inline elements (icon + text) |

### Radius Scale

| Token | Value | CSS Variable | Usage |
|-------|-------|-------------|-------|
| `radius-none` | 0px | `--dbc-radius-none` | No rounding |
| `radius-sm` | 4px | `--dbc-radius-sm` | Badges, tags |
| `radius-md` | 8px | `--dbc-radius-md` | Buttons, inputs, cards |
| `radius-lg` | 12px | `--dbc-radius-lg` | Modals, sheets |
| `radius-xl` | 16px | `--dbc-radius-xl` | Large containers |
| `radius-full` | 9999px | `--dbc-radius-full` | Circles, pills |

### Shadow Scale

| Token | CSS Variable | Value (Light) | Usage |
|-------|-------------|---------------|-------|
| `shadow-sm` | `--dbc-shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle elevation -- tooltips, dropdowns |
| `shadow-md` | `--dbc-shadow-md` | `0 4px 6px rgba(0,0,0,0.07)` | Default card elevation |
| `shadow-lg` | `--dbc-shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, popovers |
| `shadow-xl` | `--dbc-shadow-xl` | `0 20px 25px rgba(0,0,0,0.15)` | Floating elements, drawers |

Dark mode shadows use lower opacity to avoid excessive contrast against dark backgrounds.

### Z-Index Scale

| Token | Value | CSS Variable | Usage |
|-------|-------|-------------|-------|
| `z-base` | 0 | `--dbc-z-base` | Default stacking |
| `z-dropdown` | 100 | `--dbc-z-dropdown` | Dropdown menus |
| `z-sticky` | 200 | `--dbc-z-sticky` | Sticky headers, sidebars |
| `z-modal` | 300 | `--dbc-z-modal` | Modals, dialogs |
| `z-popover` | 400 | `--dbc-z-popover` | Popovers, tooltips |
| `z-toast` | 500 | `--dbc-z-toast` | Toast notifications (always on top) |

### Motion Tokens

| Token | Value | CSS Variable | Usage |
|-------|-------|-------------|-------|
| `duration-fast` | 100ms | `--dbc-duration-fast` | Micro-interactions (button press, checkbox) |
| `duration-normal` | 200ms | `--dbc-duration-normal` | Default transitions (hover, focus) |
| `duration-slow` | 300ms | `--dbc-duration-slow` | Modals, sheets, expanding panels |
| `duration-page` | 500ms | `--dbc-duration-page` | Page transitions, hero animations |
| `ease-default` | `cubic-bezier(0.4, 0, 0.2, 1)` | `--dbc-ease-default` | General transitions |
| `ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | `--dbc-ease-in` | Elements leaving |
| `ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | `--dbc-ease-out` | Elements entering |
| `ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | `--dbc-ease-spring` | Bouncy interactions |

### Animation Library Tokens

| Library | Usage | Configuration |
|---------|-------|--------------|
| Framer Motion | Page transitions, component mount/unmount, hover, layout, modal | Variants defined in `packages/ui/motion/variants.ts` |
| GSAP ScrollTrigger | Parallax hero sections, scroll-linked progress, staggered section reveals | Config in `packages/ui/motion/scroll-triggers.ts` |

**Framer Motion standard variants:**

| Variant | Duration | Easing | Transform |
|---------|----------|--------|-----------|
| `fadeIn` | 300ms | ease-out | opacity 0 -> 1 |
| `fadeSlideUp` | 300ms | ease-out | opacity 0 -> 1, y 20px -> 0 |
| `scaleIn` | 200ms | ease-out | opacity 0 -> 1, scale 0.95 -> 1 |
| `staggerChildren` | 100ms stagger | ease-out | Children fade-slide up sequentially |
| `pageEnter` | 500ms | ease-out | opacity 0 -> 1, y 10px -> 0 |

### Animation Patterns

| Pattern | Implementation | Token Source |
|---------|---------------|-------------|
| Page enter | Framer Motion `fadeSlideUp`, 300ms | `--dbc-duration-slow` |
| Section scroll reveal | GSAP ScrollTrigger, staggered 100ms | Custom GSAP config |
| Hover scale | Framer Motion `whileHover={{ scale: 1.02 }}` | `--dbc-duration-normal` |
| Modal enter | Framer Motion fade overlay + scale content | `--dbc-duration-slow` |
| Button press | Framer Motion `whileTap={{ scale: 0.98 }}` | `--dbc-duration-fast` |
| Collapsible expand | Framer Motion `AnimatePresence` + height auto | `--dbc-duration-normal` |
| QR scan result | Framer Motion scale + color flash | `--dbc-duration-slow` |

### Rules

- No magic numbers for spacing -- all spacing through tokens
- No hardcoded border-radius -- use radius tokens
- No hardcoded box-shadow -- use shadow tokens
- No hardcoded z-index -- use z-index tokens
- No hardcoded transition durations -- use motion tokens
- No hardcoded easing -- use easing tokens
- Semantic spacing tokens preferred over raw scale tokens in page/layout code
- `prefers-reduced-motion` always respected -- disable all non-essential animations
- No animations on LCP elements (hero text/image load instantly, animations trigger after)
- Lazy-load animation code below the fold (dynamic import for GSAP)
- `will-change` only on elements that actually animate

---

## 6. Component Hierarchy (6 Layers)

### The Hierarchy

Each layer depends **only** on the one below. No upward dependencies. No skipping layers.

```
Design Tokens -> Atoms -> Molecules -> Organisms -> Layouts -> Pages
```

| Layer | Purpose | Rule |
|-------|---------|------|
| **Design Tokens** | Colors, spacing, fonts, radii, shadows, motion | Single source of truth for all visual values |
| **Atoms** (UI Elements) | Button, Input, Icon, Badge | Built only from tokens. No hardcoded values |
| **Molecules** (UI Components) | FormField, TicketTierCard, CouponInput | Composed from atoms only. No custom atoms inside |
| **Organisms** (Composites) | EventCard, CheckoutForm, ScannerView | Assemblies of molecules. Orchestrate, don't reinvent |
| **Layouts / Templates** | PublicShell, AdminShell, ScanShell | Define structure only. No color/typography knowledge |
| **Pages / Screens** | EventListingPage, CheckoutPage, DashboardPage | Composition + data. Zero design decisions |

### Atom Catalog

| Atom | Variants (CVA) | Tokens Used |
|------|----------------|-------------|
| `Button` | `variant` (primary, secondary, ghost, destructive, accent), `size` (sm, md, lg) | color, radius, spacing, font |
| `Input` | `size` (sm, md, lg), `state` (default, error, disabled) | color, radius, spacing, font, border |
| `Select` | `size` (sm, md, lg) | color, radius, spacing, font |
| `Checkbox` | `size` (sm, md) | color, radius, spacing |
| `Switch` | `size` (sm, md) | color, radius, spacing |
| `Badge` | `variant` (default, success, warning, error, info, accent) | color, radius, font |
| `Avatar` | `size` (xs, sm, md, lg, xl) | color, radius, spacing |
| `Icon` | `size` (xs, sm, md, lg) | color |
| `Separator` | `orientation` (horizontal, vertical) | color, spacing |
| `Skeleton` | `variant` (text, circle, rect) | color, radius |
| `Textarea` | `size` (sm, md, lg), `state` (default, error, disabled) | color, radius, spacing, font |
| `Tooltip` | `side` (top, right, bottom, left) | color, radius, spacing, font, shadow |
| `Label` | `size` (sm, md), `required` (boolean) | color, font |
| `ProgressBar` | `variant` (default, success, warning, error), `size` (sm, md) | color, radius |
| `Spinner` | `size` (sm, md, lg) | color |
| `Tabs` | `variant` (underline, pill) | color, spacing, font |
| `Tag` | `variant` (default, removable), `color` (configurable) | color, radius, font |
| `DropdownMenu` | -- | color, radius, spacing, font, shadow |
| `Popover` | `side` (top, right, bottom, left) | color, radius, spacing, shadow |
| `Dialog` | `size` (sm, md, lg, full) | color, radius, spacing, shadow |
| `Sheet` | `side` (left, right, bottom) | color, spacing, shadow |
| `Toast` | `variant` (default, success, warning, error) | color, radius, font |

### DBC-Specific Molecules

| Molecule | Composed From | Purpose |
|----------|--------------|---------|
| `TicketTierCard` | Heading + Text + Badge + Button | Single ticket tier display with price + buy |
| `CouponInput` | Input + Button + Caption | Coupon code entry with live validation |
| `AttendeeForm` | FormField (name) + FormField (email) | Per-attendee info collection at checkout |
| `QRCodeDisplay` | Image + Text | Generated QR code with ticket token |
| `SearchBar` | Input + Icon + Button | Search with debounce |
| `FormField` | Label + Input + Caption (error/helper) | Standard form field with validation |
| `NavItem` | Icon + Text + Badge | Navigation item with unread indicator |
| `StatCard` | Heading + Text + Icon + ProgressBar | KPI display card |
| `DatePicker` | Input + Calendar popup | Date/time selection |
| `SpeakerCard` | Avatar + Heading + Text | Speaker profile mini-card |
| `LanguageToggle` | DropdownMenu + Icon | EN/DE/FR language switcher |

### DBC-Specific Organisms

| Organism | Composed From | Purpose |
|----------|--------------|---------|
| `EventCard` | Image + Heading + Text + Badge + TicketTierCard[] + Button | Full event preview with tiers |
| `CheckoutForm` | AttendeeForm[] + CouponInput + OrderSummary + Button | Complete checkout flow |
| `OrderSummary` | StatCard + Text + Separator | Checkout price breakdown |
| `AttendeeList` | SearchBar + DataTable + Pagination | Searchable attendee management |
| `ScannerView` | Camera + StatusOverlay + AttendeeInfo | Full QR scanner with result display |
| `KPIDashboardWidget` | StatCard + Chart + DatePicker | Configurable KPI panel |
| `EventSchedule` | Timeline + SpeakerCard[] | Event agenda display |
| `MediaGallery` | ImageGrid + Lightbox | Post-event photo/video gallery |
| `NotificationBell` | Icon + Badge + Sheet | Notification dropdown with unread count |
| `DoorSaleForm` | Select (tier) + AttendeeForm + Button | Quick door sale entry |
| `EmailSequenceEditor` | Timeline + FormField[] + Switch | Post-event email config |

### Layout Catalog

| Layout | File | Structure | Used By |
|--------|------|-----------|---------|
| `PublicShell` | `packages/ui/layouts/public-shell.tsx` | Navbar + LanguageToggle + ThemeToggle + main + Footer | Tickets app (public pages) |
| `AdminShell` | `packages/ui/layouts/admin-shell.tsx` | Sidebar nav + NotificationBell + main | Admin app (all pages) |
| `ScanShell` | `packages/ui/layouts/scan-shell.tsx` | Minimal header + full-screen camera area | Admin app (scan page PWA) |
| `AuthShell` | `packages/ui/layouts/auth-shell.tsx` | Centered card + DBC branding | Both apps (login pages) |
| `CheckoutShell` | `packages/ui/layouts/checkout-shell.tsx` | Steps indicator + main + OrderSummary sidebar | Tickets app (checkout) |

### Rules

- Higher layers NEVER customise lower layers
- Customisation flows ONLY through tokens and props
- No hardcoded colors, spacing, or fonts at any level above tokens
- Atoms use ONLY design tokens -- never raw values
- Molecules use ONLY atoms -- never build custom atoms inline
- Organisms use molecules and atoms -- never rebuild existing molecules
- Layouts define structure ONLY -- no color, typography, or spacing knowledge (those come from tokens)
- Pages compose organisms and layouts -- zero direct design decisions
- If a pattern is needed and no shared component exists, create it in the shared package first, then use it
- No upward dependencies: atoms never import molecules, molecules never import organisms

---

## 7. Accessibility (WCAG 2.1 AA)

DBC Germany targets **WCAG 2.1 Level AA** compliance. Accessibility is built into the component
system at the atom level -- not retrofitted.

### Color Contrast

| Context | Minimum Ratio | Standard |
|---------|--------------|----------|
| Normal text (< 18pt) | 4.5:1 | WCAG 2.1 AA |
| Large text (>= 18pt or >= 14pt bold) | 3:1 | WCAG 2.1 AA |
| UI components and graphical objects | 3:1 | WCAG 2.1 AA |
| Focus indicators | 3:1 against adjacent colors | WCAG 2.1 AA |

### Keyboard Navigation

- All interactive elements reachable via Tab key
- Tab order follows visual reading order (left-to-right, top-to-bottom)
- Focus visible at all times (custom focus ring: `ring-2 ring-offset-2 ring-dbc-primary`)
- `Escape` closes modals, drawers, dropdowns, popovers
- `Enter` or `Space` activates buttons and toggles
- Arrow keys navigate within composite widgets (tabs, radio groups, dropdowns)

### Focus Management

| Component | Focus Behavior |
|-----------|---------------|
| Modal/Dialog | Focus trapped inside while open. On close, return focus to trigger. |
| Drawer/Sheet | Focus trapped inside while open. |
| Dropdown menu | Focus moves to first item on open. Arrow keys navigate items. |
| Toast/notification | Does not steal focus. Announced via `aria-live`. |
| Page navigation | Focus moves to main content area on route change (skip-nav pattern). |
| QR Scanner | Focus on scan button. Result announced via `aria-live="assertive"`. |

### ARIA Patterns

| Component | ARIA Pattern | Key Attributes |
|-----------|-------------|----------------|
| Button | `role="button"` (native `<button>`) | `aria-disabled`, `aria-pressed` (toggles) |
| Dialog | `role="dialog"` | `aria-modal="true"`, `aria-labelledby`, `aria-describedby` |
| Tabs | `role="tablist"` + `role="tab"` + `role="tabpanel"` | `aria-selected`, `aria-controls` |
| Dropdown | `role="menu"` + `role="menuitem"` | `aria-expanded`, `aria-haspopup` |
| Progress bar | `role="progressbar"` | `aria-valuenow`, `aria-valuemin`, `aria-valuemax` |
| Toast | `role="alert"` or `aria-live="polite"` | Announced without stealing focus |
| Language toggle | `role="listbox"` | `aria-label="Language"`, `aria-selected` |

### Screen Reader Support

- All images have `alt` text (or `alt=""` for decorative images)
- Form fields have associated `<label>` elements (or `aria-label` for icon-only inputs)
- Error messages linked to fields via `aria-describedby`
- Dynamic content updates use `aria-live` regions
- Loading states announce via `aria-busy="true"` and screen-reader-only text
- QR scan results announced immediately via `aria-live="assertive"`

### Verification

- **Lighthouse accessibility score >= 90** enforced in CI
- **axe-core** automated checks in unit tests for all atom and molecule components
- **Manual testing** with VoiceOver (macOS) for critical flows: checkout, scanner, admin CRUD
- Touch targets minimum **44x44px** on mobile

---

## 8. Asset Naming Convention

### File Naming

All asset files use **kebab-case**.

### Logo Naming

Pattern: `{brand}-logo-{variant}-{colormode}.svg`

| Brand | Variant | Color Modes | Example |
|-------|---------|-------------|---------|
| `dbc` | `full` (logo + text) | `color`, `white`, `black` | `dbc-logo-full-color.svg` |
| `dbc` | `mark` (icon only) | `color`, `white`, `black` | `dbc-logo-mark-white.svg` |
| `dbc-germany` | `full` | `color`, `white`, `black` | `dbc-germany-logo-full-color.svg` |
| `richesses-dafrique` | `full` | `color`, `white`, `black` | `richesses-dafrique-logo-color.svg` |

### Icon Naming

Pattern: `icon-{name}.svg`

| Category | Examples |
|----------|---------|
| Social | `icon-facebook.svg`, `icon-instagram.svg`, `icon-linkedin.svg`, `icon-x-twitter.svg`, `icon-youtube.svg`, `icon-tiktok.svg`, `icon-whatsapp.svg` |
| Payment | `icon-visa.svg`, `icon-mastercard.svg`, `icon-sepa.svg`, `icon-paypal.svg`, `icon-apple-pay.svg` |
| UI | `icon-scan-qr.svg`, `icon-ticket.svg`, `icon-calendar.svg`, `icon-location.svg`, `icon-clock.svg`, `icon-users.svg`, `icon-download.svg`, `icon-check-circle.svg`, `icon-x-circle.svg`, `icon-arrow-up.svg` |

### Image Naming

Pattern: `{purpose}-{descriptor}.{ext}`

| Category | Examples |
|----------|---------|
| OG images | `og-default.jpg` (1200x630), `og-tickets.jpg` |
| Hero images | `hero-events.webp` |
| Patterns | `pattern-african-gold.svg`, `pattern-dots.svg` |
| Empty states | `empty-events.svg`, `empty-orders.svg`, `empty-attendees.svg`, `empty-notifications.svg` |
| Ticket templates | `ticket-bg.svg`, `ticket-watermark.svg` |
| Email assets | `email-header-logo.png`, `email-footer-social.png`, `email-banner-default.png` |

### Format Rules

- SVG preferred for logos, icons, patterns (scalable, small)
- WebP for photos and complex images
- PNG only for email assets (email client compatibility)
- OG images: 1200x630px, JPG
- PWA icons: `icon-192.png`, `icon-512.png`
- Favicon: `favicon.ico` per app `public/`, source: `dbc-favicon.svg`
- All assets centralized in `packages/assets/`, copied to app `public/` at build time

---

## 9. Text and Internationalization (i18n)

### Principle

Text content is a parallel SSOT system, separate from visual styling. Text and UI meet only at
component props/slots. No component owns its strings. No page hardcodes text.

### 5-Layer Stack

```
Message Keys (Text Tokens) -> Localized Definitions -> Text Adapters -> Component Slots -> Pages
```

| Layer | Purpose |
|-------|---------|
| **Message Keys** | Semantic keys (e.g., `auth.login.title`, `tickets.checkout.couponPlaceholder`). No UI knowledge. |
| **Localized Definitions** | Language-specific strings in EN, DE, FR. Translators work here. |
| **Text Adapters** | Pluralization, date/currency formatting, ICU MessageFormat rules. |
| **Component Text Slots** | Components expose slots/props for text. They never own or invent strings. |
| **Pages** | Choose which message key to use. Never contain literal text. |

### Message File Structure

```
packages/i18n/messages/
  en.json       <- English (authoritative for key structure)
  de.json       <- German
  fr.json       <- French
```

Keys follow dot-separated namespace hierarchy, matching nested JSON structure:

```json
{
  "events": {
    "details": {
      "title": "Event Details",
      "date": "Date",
      "venue": "Venue",
      "speakers": "Speakers",
      "schedule": "Schedule"
    }
  }
}
```

### Namespace Tree

| Namespace | Purpose |
|-----------|---------|
| `common` | Shared across all apps: actions (save, cancel, delete), labels, generic errors, pagination, confirmation dialogs |
| `auth` | Login, magic link, password reset, session expired, role labels |
| `events` | Event details, schedule, speakers, venue info, event listing, event card |
| `tickets` | Tiers, checkout, confirmation, ticket PDF, transfer, waitlist |
| `orders` | Order status, history, refunds, payment method labels |
| `admin` | Dashboard, staff management, settings, system preferences |
| `scan` | Scanner UI, check-in messages (success, already scanned, invalid), attendee info |
| `aftercare` | Email subjects, survey text, media gallery labels |
| `gdpr` | Cookie consent, privacy policy, terms of service, data deletion |
| `marketing` | Public-facing content: footer links, CTA text, hero text (fetched by Framer) |
| `validation` | Form validation messages: required, email format, min/max length, phone format |
| `notifications` | Notification types, bell labels, real-time alert text |
| `kpi` | KPI labels, chart legends, report headers, metric descriptions |

### ICU MessageFormat

Used for dynamic text content -- pluralization, numbers, dates, currencies.

```
{count, plural,
  =0 {No tickets}
  one {# ticket}
  other {# tickets}
}
```

ICU variables use `camelCase` inside `{braces}`: `{attendeeName}`, `{eventTitle}`, `{totalAmount}`.

### Web i18n Configuration

**Config file:** `packages/i18n/request.ts`
**Plugin:** `createNextIntlPlugin` wraps `next.config.ts`.

Server Components use `getTranslations()` (async):
```typescript
import { getTranslations } from 'next-intl/server'
const t = await getTranslations('events')
return <h1>{t('details.title')}</h1>
```

Client Components use `useTranslations()` (synchronous hook):
```typescript
'use client'
import { useTranslations } from 'next-intl'
const t = useTranslations('tickets')
return <button>{t('checkout.buyNow')}</button>
```

Messages are loaded server-side via `getMessages()` in root `layout.tsx` and passed to
`<NextIntlClientProvider messages={messages}>` -- Client Components receive them through
context, never via a separate network request.

### Email and PDF Template Variables

Template variables use double-brace `camelCase` -- distinct from ICU variables used in UI strings:

`{{attendeeName}}`, `{{eventTitle}}`, `{{orderTotal}}`, `{{ticketTier}}`

The double-brace distinguishes template engine syntax from i18n interpolation syntax,
preventing accidental substitution.

### Rules

- Components NEVER invent text -- all text comes from message keys via props/slots
- Pages NEVER hardcode text -- all text resolved from message keys
- All text resolves from message keys -- no literal strings in any component
- EN JSON is the authoritative key source -- DE and FR are translations of it
- Brand constants (`DBC_BRAND_NAME`, `DBC_GERMANY_NAME`) use shared constants for code, i18n for display
- Email/PDF template variables use `{{camelCase}}` double-brace syntax
- ICU `{camelCase}` is for UI strings; `{{camelCase}}` is for email/PDF templates

---

## 10. Data SSOT

### Database Is the Canonical Schema

The PostgreSQL database schema is the **single source of truth** for all data shapes. All other
type definitions are derived -- never manually defined.

```
PostgreSQL Schema (SSOT)
    |
    ▼  supabase gen types typescript
TypeScript types (generated)
    |
    ▼
packages/types/database.ts
    |
    ▼  consumed by
┌──────────┐  ┌──────────┐
│ Tickets  │  │  Admin   │
│   App    │  │   App    │
└──────────┘  └──────────┘
```

### Type Generation

```bash
supabase gen types typescript --local > packages/types/database.ts
```

Run after every schema migration. Never manually edit `database.ts`.

### Enum SSOT

All enums are defined as **PostgreSQL types** first:

```sql
CREATE TYPE event_type AS ENUM ('conference', 'masterclass');
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'comped', 'refunded', 'cancelled');
CREATE TYPE acquisition_type AS ENUM ('purchased', 'invited', 'assigned', 'door_sale');
CREATE TYPE payment_method_type AS ENUM ('card', 'sepa', 'paypal', 'cash');
CREATE TYPE user_role AS ENUM ('buyer', 'team_member', 'manager', 'admin', 'super_admin');
CREATE TYPE media_type AS ENUM ('photo', 'video', 'link');
CREATE TYPE discount_type AS ENUM ('percentage', 'fixed_amount');
CREATE TYPE user_locale AS ENUM ('en', 'de', 'fr');
```

Then generated into TypeScript:

```typescript
// Generated -- do not edit manually
export type OrderStatus = 'pending' | 'paid' | 'comped' | 'refunded' | 'cancelled';
export type AcquisitionType = 'purchased' | 'invited' | 'assigned' | 'door_sale';
export type UserRole = 'buyer' | 'team_member' | 'manager' | 'admin' | 'super_admin';
```

Enum values are **never hardcoded** in application code -- always reference the generated definitions.

### Column and Limit Constants

Named constants for all `.select()` column lists prevent `SELECT *` creep:

```typescript
// packages/supabase/constants/events.ts
export const EVENT_LIST_COLUMNS = [
  'id', 'slug', 'title_en', 'title_de', 'title_fr',
  'starts_at', 'ends_at', 'venue_name', 'city',
  'cover_image_url', 'is_published', 'capacity',
] as const;

export const EVENT_DETAIL_COLUMNS = [
  ...EVENT_LIST_COLUMNS,
  'description_en', 'description_de', 'description_fr',
  'venue_address', 'timezone', 'max_tickets_per_order',
  'enabled_payment_methods', 'event_type',
] as const;

export const TICKET_LIST_COLUMNS = [
  'id', 'ticket_token', 'attendee_name', 'attendee_email',
  'checked_in_at', 'checked_in_by', 'is_transferred',
  'notes', 'tier_id', 'created_at',
] as const;

export const EVENT_LIST_LIMIT = 20 as const;
export const ATTENDEE_LIST_LIMIT = 50 as const;
export const ORDER_LIST_LIMIT = 50 as const;
export const NOTIFICATION_LIST_LIMIT = 20 as const;
```

### Price Storage

- All monetary values stored as **integer cents** (`price_cents int`)
- EUR49.00 = `4900`
- Currency column: `currency text DEFAULT 'EUR'`
- Display formatting: server-side `Intl.NumberFormat` with locale

### Date/Time Storage

- All timestamps stored as `timestamptz` (UTC) in PostgreSQL
- Event timezone stored as `timezone text DEFAULT 'Europe/Berlin'`
- Display: `Intl.DateTimeFormat` with the event's timezone and user's locale
- Sale windows (`sales_start_at`, `sales_end_at`) are absolute UTC timestamps

### Primary Keys

- All tables use `id uuid DEFAULT gen_random_uuid()` as primary key
- Exception: `audit_log` and `analytics_events` use `id bigint` (auto-increment) for performance

### Rules

- Never define data shapes manually -- always generate from the database schema
- Never use `SELECT *` or `.select('*')` (exception: count-only queries)
- Never hardcode enum values in application code -- use generated definitions
- `.select()` and `.limit()` calls use named constants -- no hardcoded strings or magic numbers
- Run `supabase gen types typescript` after every schema migration
- All prices in integer cents, all dates in `timestamptz`

---

## 11. Business Logic SSOT

### Server-Side Only

The client (any app) MUST NEVER:

- Calculate prices or discounts
- Decide permissions or access levels
- Modify inventory quantities (ticket counts)
- Compute financial data (revenue, order totals)
- Execute business rules (ticket availability, coupon validation)
- Decide state transitions (order status changes)

### Client Responsibility

All clients are limited to:

1. Render UI
2. Send intents (actions)
3. Display server results

### Permission Model

Three-layer enforcement (no RLS -- single tenant):

```
Middleware (route-level) -> Role Guard (action-level) -> Server Action Guard (per-operation)
```

**Middleware** (`apps/admin/middleware.ts`):
- Checks authentication on all admin routes
- Redirects unauthenticated users to login
- Locale detection and routing

**Role Guard** (`requireRole()`):
- Called as the first line of every Server Action
- Reads role from `profiles` table (NEVER from JWT or cache)
- Throws if insufficient permissions

```typescript
// packages/supabase/guards.ts
export async function requireRole(
  minimumRole: 'team_member' | 'manager' | 'admin' | 'super_admin'
): Promise<Profile> {
  const user = await getAuthUser();
  const profile = await getProfile(user.id);
  if (!hasMinimumRole(profile.role, minimumRole)) {
    throw new Error('INSUFFICIENT_PERMISSIONS');
  }
  return profile;
}
```

**Event-scoped guard** (Team Members only):
```typescript
export async function requireEventAccess(
  staffId: string,
  eventId: string
): Promise<void> {
  const assignment = await supabase
    .from('staff_event_assignments')
    .select('staff_id')
    .eq('staff_id', staffId)
    .eq('event_id', eventId)
    .single();
  if (!assignment.data) throw new Error('NOT_ASSIGNED_TO_EVENT');
}
```

### Role Hierarchy

| Permission | Team Member | Manager | Admin | Super Admin |
|-----------|:-----------:|:-------:|:-----:|:-----------:|
| Scan QR (assigned events) | Y | Y | Y | Y |
| View attendees (assigned events) | Y | Y | Y | Y |
| Door sales (assigned events) | Y | Y | Y | Y |
| Create/edit events | -- | Y | Y | Y |
| Manage tiers + coupons | -- | Y | Y | Y |
| Send/assign tickets | -- | Y | Y | Y |
| Bulk CSV send | -- | Y | Y | Y |
| View all orders | -- | Y | Y | Y |
| Issue refunds | -- | -- | Y | Y |
| View KPI dashboard | -- | -- | Y | Y |
| Export data (CSV/PDF) | -- | -- | Y | Y |
| Manage staff accounts | -- | -- | Y | Y |
| Audit log access | -- | -- | -- | Y |
| System settings | -- | -- | -- | Y |
| GDPR data deletion | -- | -- | -- | Y |

### Validation

- **Server-side validation is authoritative** -- always runs, always trusted
- **Client-side validation is optional UX convenience** -- reduces round trips
- A client can never bypass server validation by submitting directly
- Zod schemas shared between client and server where possible

### State Machines

**Order status:**
```
pending -> paid          (Stripe webhook confirms payment)
pending -> cancelled     (payment timeout or manual cancel)
paid -> refunded         (admin issues refund via Stripe)
comped -> (terminal)     (complimentary tickets have no further transitions)
```

**Ticket lifecycle:**
```
created -> emailed       (PDF generated + sent)
emailed -> checked_in    (QR scanned at event)
emailed -> transferred   (holder transfers to new attendee)
transferred -> emailed   (new attendee receives new PDF)
```

### Business Rules Catalog

| Rule | Logic | Location |
|------|-------|----------|
| **Ticket Purchase** | Validate availability (atomic UPDATE), validate coupon, create Stripe session, deduct inventory on webhook | `actions/purchase-ticket.ts` |
| **Ticket Scanning** | Lookup by token, validate event match, check not already scanned, record check-in atomically | `actions/check-in.ts` |
| **Ticket Transfer** | Invalidate old token, generate new token + QR + PDF, update attendee info | `actions/transfer-ticket.ts` |
| **Refund** | Admin only, Stripe refund API, restore inventory, update order status | `actions/refund-order.ts` |
| **Door Sale** | Create order (paid, cash), generate ticket immediately | `actions/door-sale.ts` |
| **Coupon Redemption** | Validate code, date range, max uses, applicable tiers, compute discount | `actions/apply-coupon.ts` |
| **Waitlist** | FIFO queue, 24h expiry window, atomic position tracking | `actions/manage-waitlist.ts` |
| **Aftercare Sequence** | Cron-triggered, check delay_days against event end date, send per locale | `api/cron/aftercare/route.ts` |
| **Inventory Hold** | 10-minute reservation on checkout intent, release if unpaid | `actions/reserve-tickets.ts` |

### Rules

- All business logic runs server-side only -- no exceptions
- Clients render + send intents -- the server decides everything
- State transitions defined in one place, consumed by all apps
- Client-side validation is never trusted -- server re-validates
- No business rule can be reverse-engineered from frontend code
- Server actions call `requireRole()` as their first operation
- NEVER cache role in JWT claims or session -- check from `profiles` table every time

---

## 12. Calculation SSOT

### All Formulas in Server Actions

Every financial and KPI formula lives in Server Actions -- never in client-side code.

### Formula Catalog

| Category | Formula | Implementation |
|----------|---------|---------------|
| **Checkout subtotal** | `SUM(tier_price_cents * quantity)` | Server Action |
| **Coupon discount (percentage)** | `subtotal * (discount_value / 100)` | Server Action |
| **Coupon discount (fixed)** | `MIN(discount_value_cents, subtotal)` | Server Action |
| **Order total** | `subtotal - discount` (never negative) | Server Action |
| **Sell-through rate** | `(tickets_sold / capacity) * 100` | KPI query |
| **No-show rate** | `((tickets_sold - check_ins) / tickets_sold) * 100` | KPI query |
| **Check-in rate** | `(check_ins / tickets_sold) * 100` | KPI query |
| **Average order value** | `total_revenue_cents / order_count` | KPI query |
| **Conversion rate** | `(completed_orders / event_page_views) * 100` | KPI query |
| **Sales velocity** | `orders_per_day` over configurable window | KPI query |
| **Repeat buyer rate** | `buyers_with_2plus_orders / total_unique_buyers * 100` | Cross-event query |
| **Revenue by tier** | `SUM(total_cents) GROUP BY tier_id` | KPI query |
| **Revenue by payment method** | `SUM(total_cents) GROUP BY payment_method` | KPI query |
| **Coupon performance** | `times_used, SUM(discount_cents) per coupon` | KPI query |

### Rounding Rules

| Calculation | Method |
|-------------|--------|
| Coupon discount | Round half-up to nearest cent |
| Order total | Round half-up, floor at 0 (never negative) |
| KPI percentages | Round to 1 decimal place for display |
| Currency display | Always 2 decimal places (`Intl.NumberFormat`) |

### Server-Side Recomputation

- Checkout sends **tier IDs + quantities + coupon code** -- never pre-computed totals
- Server Action fetches current prices from DB, validates coupon, computes total
- This prevents amount tampering -- the client never controls the price
- Stripe Checkout session receives the server-computed amount

### Rules

- No calculations on any client -- Server Actions only
- No inline formulas -- all formulas reference shared utility functions
- Server recomputes everything -- client-submitted totals are never trusted
- KPI definitions are centralized in query utilities, not duplicated per page

---

## 13. UI Behavior Patterns

### Loading States

| Context | Pattern | Implementation |
|---------|---------|---------------|
| Page load | Skeleton screen matching layout structure | `Skeleton` atom with matching dimensions |
| Data table load | Skeleton rows (5 rows) with column-width-matched bones | Skeleton rows inside table layout |
| Card load | Skeleton card with image rect + text lines | Skeleton atoms composed in card molecule |
| Inline refresh | Subtle opacity reduction (0.6) + spinner overlay | `opacity-60` + centered `Spinner` |
| Action in progress | Button loading state: spinner replaces label, disabled | Button `loading` prop |
| Navigation | Top progress bar (2px, primary color) | NProgress-style bar at `z-toast` layer |

### Empty States

| Context | Pattern |
|---------|---------|
| Empty event list | Illustration + "No events yet" + "Create your first event" button |
| Empty attendee list | Illustration + "No attendees" + context-appropriate action |
| Empty orders | Illustration + "No orders yet" |
| Empty notifications | Illustration + "All caught up!" |
| Empty search results | "No results for '{query}'" + "Try a different search term" |
| Filtered to nothing | "No items match your filters" + "Clear filters" link |

### Error States

| Tier | Display | Example |
|------|---------|---------|
| Field validation | Inline error below field, red border | "Email is required" |
| Form-level error | Error summary banner above form | "3 fields need attention" |
| Action failure | Toast notification (error variant) | "Failed to save event" |
| Permission denied | Toast + redirect | "You don't have permission" |
| Network error | Persistent banner at top of page | "Connection lost. Retrying..." |
| Server error (5xx) | Full-page error boundary with retry | "Something went wrong" |
| Not found (404) | Full-page with navigation back | "This page doesn't exist" |

### Toast Patterns

| Variant | Duration | Dismissal | Use Case |
|---------|----------|-----------|----------|
| Success | 3 seconds | Auto + manual | Check-in confirmed, ticket sent |
| Error | 5 seconds | Auto + manual | Action failed, validation error |
| Warning | 5 seconds | Auto + manual | Low inventory, expiring coupon |
| Info | 3 seconds | Auto + manual | Neutral information |

Toasts stack from bottom-right (desktop) / bottom-center (mobile). Maximum 3 visible.

### Form Validation Patterns

| Event | Behavior |
|-------|----------|
| On blur | Validate current field, show inline error if invalid |
| On change (after error) | Re-validate on keystroke to clear error immediately |
| On submit | Validate all fields, scroll to first error |
| Server response | Map server errors to fields via field name |

### Financial UI

- Amounts always formatted with currency symbol: `EUR 49.00` or `49,00 EUR` (locale-dependent)
- Discount shown as strikethrough original + new price
- "Free" for EUR 0.00 tickets (invited/comped)
- Prices stored in cents, displayed via `Intl.NumberFormat`

### Scanner UI

- Full-screen camera view via `html5-qrcode`
- Large status overlay: green checkmark (valid) / red X (invalid/already scanned)
- Auto-reset after 2 seconds to ready state
- Vibration feedback on scan (if supported)
- Attendee name + tier displayed on success
- Original scan time + staff name displayed on duplicate

### Real-Time Updates

- Supabase Realtime for notifications + live check-in counters
- Brief highlight flash (gold background, fade 1s) on updated data
- Optimistic updates for check-in (show green immediately, reconcile on server response)

### Responsive Breakpoints

| Breakpoint | Width | Target |
|-----------|-------|--------|
| `sm` | 640px | Large phones |
| `md` | 768px | Tablets |
| `lg` | 1024px | Desktops |

Mobile-first design. Touch targets minimum 44x44px.

---

## 14. Email Template SSOT

### Template Location

All email templates in `packages/email/templates/`.

### Template Catalog

| Template | Trigger | Recipients | Attachments |
|----------|---------|------------|-------------|
| `ticket-confirmation.tsx` | Stripe webhook (payment confirmed) | Each attendee individually | PDF ticket with QR |
| `order-summary.tsx` | Stripe webhook (payment confirmed) | Buyer | All PDFs for the order |
| `magic-link.tsx` | Auth: buyer login | Buyer | None |
| `invite-ticket.tsx` | Admin sends invite | Invited attendee | PDF ticket with QR |
| `assigned-ticket.tsx` | Admin assigns ticket | Assigned attendee | PDF ticket with QR |
| `door-sale-ticket.tsx` | Door sale completed | Attendee (if email provided) | PDF ticket with QR |
| `aftercare-thankyou.tsx` | Day 0 after event end | All attendees | None |
| `aftercare-survey.tsx` | Day 2 after event end | All attendees | None |
| `aftercare-media.tsx` | Day 7 after event end | All attendees | None |
| `aftercare-promo.tsx` | Day 14 after event end | All attendees | None |
| `waitlist-notification.tsx` | Tier becomes available | Waitlisted email | None |
| `ticket-transfer.tsx` | Ticket transferred | New attendee | PDF ticket with QR |
| `refund-confirmation.tsx` | Admin issues refund | Buyer | None |

### Template Structure

Every email template follows the same structure:

```tsx
// packages/email/templates/ticket-confirmation.tsx
import { getTranslations } from '@dbc/i18n'

interface TicketConfirmationProps {
  attendeeName: string;
  eventTitle: string;     // already localized by caller
  tierName: string;       // already localized by caller
  eventDate: string;      // formatted by caller
  venueAddress: string;
  qrCodeUrl: string;
  locale: 'en' | 'de' | 'fr';
}
```

### Branding

- DBC Germany logo header (PNG for email client compatibility)
- Brand colors: red primary, gold accents
- Footer: social links, unsubscribe link, legal address
- Responsive layout (tested in Gmail, Outlook, Apple Mail)

### Rules

- All email copy comes from i18n JSON -- templates never hardcode text
- Templates receive the `locale` parameter to determine language
- PDF tickets generated in the recipient's locale
- Variables use `{{camelCase}}` double-brace syntax
- Every template includes the DBC Germany branded header + footer
- All emails include an unsubscribe mechanism (CAN-SPAM / GDPR compliance)

---

## 15. Trilingual Enforcement

### Scope

**EVERY** user-facing string must exist in EN, DE, and FR -- no exceptions.

This includes:
- All UI text (buttons, labels, headings, placeholders, error messages)
- All email content (subjects, bodies)
- All PDF ticket text
- All event content (titles, descriptions, schedule items, speaker bios)
- All legal pages (privacy policy, terms of service)
- All toast messages, validation messages, empty states
- All notification text
- Admin dashboard UI (staff uses their preferred language)

### URL Structure

```
/{locale}/...

Examples:
/en/events/richesses-dafrique-june-2026
/de/events/richesses-dafrique-june-2026
/fr/events/richesses-dafrique-june-2026
```

### Locale Detection and Routing

1. Middleware reads `Accept-Language` header
2. Checks for existing `dbc-locale` cookie
3. If no cookie: redirects to best-match locale
4. If cookie exists: uses stored preference
5. Manual switch via `LanguageToggle` component updates cookie + redirects

### Database Content

Trilingual columns for all user-facing text:

```sql
-- Events
title_en text NOT NULL, title_de text NOT NULL, title_fr text NOT NULL,
description_en text, description_de text, description_fr text,

-- Ticket Tiers
name_en text NOT NULL, name_de text NOT NULL, name_fr text NOT NULL,
description_en text, description_de text, description_fr text,

-- Event Schedule Items
title_en text NOT NULL, title_de text NOT NULL, title_fr text NOT NULL,

-- Email Sequences
subject_en text NOT NULL, subject_de text NOT NULL, subject_fr text NOT NULL,
body_en text NOT NULL, body_de text NOT NULL, body_fr text NOT NULL,
```

### Locale Resolution Helper

```typescript
// packages/i18n/resolve-locale-field.ts
export function resolveLocaleField<T extends Record<string, unknown>>(
  row: T,
  field: string,
  locale: 'en' | 'de' | 'fr'
): string {
  const localized = row[`${field}_${locale}`];
  if (localized) return localized as string;
  // Fallback chain: requested locale -> EN -> first non-empty
  return (row[`${field}_en`] || row[`${field}_de`] || row[`${field}_fr`] || '') as string;
}
```

### Fallback Chain

```
Requested locale -> EN (fallback) -> Never show raw key
```

If a translation is missing:
- **i18n strings**: fall back to EN (next-intl `onError` handler logs missing keys)
- **Database content**: fall back to EN column
- **Never** show a raw key like `tickets.checkout.couponInvalid` to the user

### CI Enforcement

Build-time check that compares all keys in `en.json`, `de.json`, `fr.json`:
- Fail build if any key exists in EN but is missing in DE or FR
- Log missing keys as build warnings during development
- Strict enforcement in production builds

### Rules

- EVERY user-facing string must exist in EN, DE, and FR
- URL structure: `/{locale}/...` for all routes in both apps
- Language toggle visible on every page in all apps
- Database content: trilingual columns for all user-facing text
- Email templates render in the recipient's locale
- PDF tickets generated in the buyer's/recipient's locale
- Error messages, toasts, validation messages: all from i18n JSON
- Legal pages must be legally accurate in all 3 languages
- Fallback: missing translation -> EN (never show raw key)

---

## 16. Naming Conventions (Global)

### Files and Directories

**Always kebab-case.**

| Type | Pattern | Example |
|------|---------|---------|
| Components | `{name}.tsx` | `event-card.tsx`, `checkout-form.tsx` |
| Server Actions | `actions/{verb}-{noun}.ts` | `actions/purchase-ticket.ts`, `actions/check-in.ts` |
| API routes | `api/{resource}/route.ts` | `api/webhooks/stripe/route.ts` |
| Lib/utils | `lib/{purpose}.ts` | `lib/supabase-server.ts`, `lib/format-currency.ts` |
| Types | `types/{domain}.ts` | `types/database.ts`, `types/event.ts` |
| i18n | `messages/{locale}.json` | `messages/en.json`, `messages/de.json` |

### Exports and Imports

| Kind | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `export function EventCard()` |
| Functions | camelCase | `export function purchaseTicket()` |
| Constants | SCREAMING_SNAKE_CASE | `export const MAX_TICKETS_PER_ORDER = 10` |
| Types/interfaces | PascalCase | `export type TicketTier`, `export interface Order` |
| Enums | PascalCase name, SCREAMING_SNAKE_CASE values | `EventType.CONFERENCE` |

### Database Naming

| Element | Convention | Example |
|---------|-----------|---------|
| Tables | snake_case plural | `ticket_tiers`, `audit_log`, `analytics_events` |
| Columns | snake_case | `checked_in_at`, `buyer_id`, `stripe_payment_intent_id` |
| Enums | snake_case | `event_type`, `acquisition_type` |
| Enum values | snake_case | `door_sale`, `magic_link` |
| Indexes | `idx_{table}_{columns}` | `idx_tickets_event_id_checked_in_at` |
| Foreign keys | `{referenced_table_singular}_id` | `event_id`, `buyer_id`, `tier_id` |
| Unique constraints | `uq_{table}_{columns}` | `uq_waitlist_entries_event_id_tier_id_email` |

### i18n Keys

Dot-notation namespaces, camelCase leaf keys:

```
events.details.title
tickets.checkout.couponPlaceholder
common.buttons.submit
auth.magicLink.emailSent
scan.result.alreadyCheckedIn
admin.dashboard.totalRevenue
```

Never abbreviate: `auth.magicLink.emailSent` (not `auth.ml.sent`).

### CSS Variables

Pattern: `--dbc-{category}-{token}`

```
--dbc-color-primary
--dbc-color-bg-secondary
--dbc-spacing-card-padding
--dbc-radius-md
--dbc-shadow-lg
--dbc-z-modal
--dbc-duration-slow
--dbc-ease-default
--dbc-font-heading
```

### Environment Variables

| Variable | Scope | Prefix |
|----------|-------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client-safe | `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client-safe | `NEXT_PUBLIC_` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only | None |
| `STRIPE_SECRET_KEY` | Server-only | None |
| `STRIPE_WEBHOOK_SECRET` | Server-only | None |
| `RESEND_API_KEY` | Server-only | None |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Client-safe | `NEXT_PUBLIC_` |
| `TURNSTILE_SECRET_KEY` | Server-only | None |
| `NEXT_PUBLIC_APP_URL` | Client-safe | `NEXT_PUBLIC_` |

Never invent new env var names -- all defined in `.env.example` per app.

### URL Slugs

- kebab-case, auto-generated from EN title
- Example: `/en/events/richesses-dafrique-june-2026`
- Event slugs are **unique and immutable** once published

---

## 17. Conflict Prevention (Proven Failure Modes)

Documented failure patterns from Eventbrite, Ticketmaster, Weezevent, and similar platforms.
Each MUST be addressed in implementation.

### A. Overselling (Race Condition)

**Problem:** Two buyers grab the last ticket simultaneously.

**Prevention:** Atomic PostgreSQL UPDATE with guard clause:

```sql
UPDATE ticket_tiers
SET quantity_sold = quantity_sold + $quantity
WHERE id = $tier_id
  AND quantity_sold + $quantity <= COALESCE(max_quantity, 999999)
RETURNING *;
```

- If zero rows returned: tier is sold out, reject the purchase
- NEVER deduct inventory on checkout intent -- only on confirmed payment (webhook)
- Add a 10-minute hold: create order as `pending`, reserve quantity, release if unpaid

### B. Stripe Webhook Race

**Problem:** Webhook arrives before redirect handler, or arrives twice.

**Prevention:**
- Create order (status: `pending`) BEFORE redirecting to Stripe Checkout
- Webhook handler: look up order by `stripe_payment_intent_id`, not by creating a new one
- Store processed webhook event IDs in `processed_webhooks` table (deduplicate)
- Reconciliation cron: check Stripe for orders stuck in `pending` > 15 minutes

```sql
-- Idempotent webhook processing
INSERT INTO processed_webhooks (id, source, processed_at)
VALUES ($stripe_event_id, 'stripe', NOW())
ON CONFLICT (id) DO NOTHING
RETURNING id;
-- If zero rows returned: already processed, skip
```

### C. Double Check-In (QR Scanning)

**Problem:** Scanner retries during network lag, ticket scanned twice.

**Prevention:** Atomic check-in query:

```sql
UPDATE tickets
SET checked_in_at = NOW(), checked_in_by = $staff_id
WHERE ticket_token = $token
  AND event_id = $event_id
  AND checked_in_at IS NULL
RETURNING *;
```

- If zero rows: already checked in (show red alert with original scan time)
- Client: disable scan button for 2s after successful scan

### D. Transferred Ticket Still Works

**Problem:** Old QR code still valid after transfer.

**Prevention:** On transfer, generate NEW `ticket_token` (UUID), update the row. Old token
no longer matches any row. Never reuse tokens.

```sql
UPDATE tickets
SET ticket_token = gen_random_uuid(),
    attendee_name = $new_name,
    attendee_email = $new_email,
    is_transferred = true,
    pdf_url = NULL  -- force PDF regeneration
WHERE id = $ticket_id
RETURNING ticket_token;
```

### E. Coupon Overuse

**Problem:** Coupon used more times than `max_uses` under concurrent load.

**Prevention:** Atomic increment:

```sql
UPDATE coupons
SET times_used = times_used + 1
WHERE id = $coupon_id
  AND (max_uses IS NULL OR times_used < max_uses)
  AND is_active = true
  AND (valid_from IS NULL OR valid_from <= NOW())
  AND (valid_until IS NULL OR valid_until >= NOW())
RETURNING *;
```

- If zero rows: coupon exhausted, expired, or inactive

### F. Stale ISR Cache

**Problem:** Public page shows sold-out tier as available, or old prices.

**Prevention:**
- On admin mutations: call `revalidatePath('/[locale]/events/[slug]')`
- Inventory counts: never rely on ISR -- fetch via client-side `useSWR` that bypasses cache
- ISR revalidate: 30s max for event pages
- Always validate availability server-side at checkout regardless of page display

### G. PDF Generation Failure

**Problem:** PDF generation fails silently, buyer gets no ticket.

**Prevention:**
- Generate PDFs asynchronously (Server Action queues, background process retries)
- Store in Supabase Storage with URL in `tickets.pdf_url`
- If `pdf_url` is null: show "Generating your ticket..." with retry
- `email_sent_at` timestamp prevents duplicate sends
- Dead-letter: if PDF fails 3 times, create admin notification

### H. Timezone Conflicts

**Problem:** Sale starts at "midnight" but in which timezone?

**Prevention:**
- Store all times as `timestamptz` (UTC) in PostgreSQL
- Store event timezone: `timezone text DEFAULT 'Europe/Berlin'`
- Display with `Intl.DateTimeFormat` using event's timezone
- Admin UI shows timezone picker when creating events

### I. i18n Key Leaks

**Problem:** Missing translation shows raw key to user.

**Prevention:**
- CI check: compare all keys across `en.json`, `de.json`, `fr.json` -- fail build if missing
- Runtime fallback: missing DE/FR -> EN -> never show raw key
- `next-intl` `onError` handler: log missing keys for monitoring

### J. Role Escalation After Demotion

**Problem:** Demoted user's session retains old permissions.

**Prevention:**
- NEVER cache role in JWT claims or session
- Check role from `profiles` table on EVERY Server Action
- On role change: `supabase.auth.admin.signOut(userId)` invalidates all sessions

### K. Bulk CSV Duplicates

**Problem:** CSV import retries after partial failure sends duplicate tickets.

**Prevention:**
- Each row idempotent: key on `(email, event_id, tier_id)` -- skip if exists
- Process in chunks of 50, checkpoint after each chunk
- Return report: X sent, Y skipped (already exists), Z failed

### L. Concurrent Admin Edits

**Problem:** Two admins edit the same event, one overwrites the other.

**Prevention:** Optimistic locking:

```sql
UPDATE events
SET title_en = $new_title, updated_at = NOW()
WHERE id = $event_id
  AND updated_at = $last_known_updated_at
RETURNING *;
```

- If zero rows: "This record was modified by another user. Refresh to see changes."

---

## 18. Non-Negotiable Rules (Consolidated)

Every rule below is a **hard audit failure**. No exceptions. No "just this once."

### Design Tokens

| # | Rule |
|---|------|
| 1 | No hardcoded hex color values in any component |
| 2 | No hardcoded font sizes, weights, or line heights -- tokens only |
| 3 | No magic numbers for spacing -- spacing tokens only |
| 4 | No hardcoded border-radius -- radius tokens only |
| 5 | No hardcoded box-shadow -- shadow tokens only |
| 6 | No hardcoded z-index -- z-index tokens only |
| 7 | No hardcoded transition durations -- motion tokens only |

### Colors

| # | Rule |
|---|------|
| 8 | Only red-gold-white-gray palette + 4 alert colors -- no other hues |
| 9 | Alert colors for status communication only -- never decorative |
| 10 | All grays are pure neutral -- no cool-toned (blue-gray, slate) |
| 11 | WCAG 2.1 AA contrast ratios enforced (4.5:1 text, 3:1 UI) |
| 12 | Dark mode variants for every semantic color token |

### Typography

| # | Rule |
|---|------|
| 13 | Components NEVER define inline font sizes/weights/line heights |
| 14 | Pages NEVER override typography atom styling |
| 15 | Only 3 font families: Montserrat, Ubuntu, DM Sans |
| 16 | New text contexts require new presets -- not one-off styles |

### Component Hierarchy

| # | Rule |
|---|------|
| 17 | Higher layers NEVER customise lower layers |
| 18 | Atoms use ONLY design tokens -- never raw values |
| 19 | Molecules use ONLY atoms -- never build custom atoms inline |
| 20 | Layouts define structure ONLY -- no color/typography knowledge |
| 21 | Pages make zero direct design decisions |

### Text and i18n

| # | Rule |
|---|------|
| 22 | No hardcoded strings in any component |
| 23 | Components NEVER invent text -- all text from message keys |
| 24 | Pages NEVER contain literal text |
| 25 | EN JSON is the authoritative i18n source -- DE/FR translated from it |
| 26 | Email/PDF template variables use `{{camelCase}}` double-brace syntax |

### Trilingual

| # | Rule |
|---|------|
| 27 | EVERY user-facing string must exist in EN, DE, and FR |
| 28 | CI build fails if any i18n key is missing in any language |
| 29 | Database content uses trilingual columns (never single-language) |
| 30 | Fallback: missing translation -> EN (never show raw key) |

### Data

| # | Rule |
|---|------|
| 31 | Never define data shapes manually -- generate from database schema |
| 32 | Never use `SELECT *` or `.select('*')` (except count-only) |
| 33 | Never hardcode enum values -- use generated definitions |
| 34 | `.select()` and `.limit()` use named constants |
| 35 | All prices in integer cents, all dates in `timestamptz` |

### Business Logic

| # | Rule |
|---|------|
| 36 | All business logic runs server-side only -- no exceptions |
| 37 | Clients render + send intents -- the server decides everything |
| 38 | State transitions defined server-side only |
| 39 | Client-side validation is never trusted -- server re-validates |
| 40 | Server actions call `requireRole()` as their first operation |
| 41 | Role checked from DB on every request -- never cached in JWT/session |

### Calculations

| # | Rule |
|---|------|
| 42 | No calculations on any client -- Server Actions only |
| 43 | Server recomputes everything -- client-submitted totals never trusted |
| 44 | Checkout sends tier IDs + quantities -- never pre-computed prices |

### Conflict Prevention

| # | Rule |
|---|------|
| 45 | Atomic DB operations for inventory, coupons, check-in (WHERE guard clauses) |
| 46 | Idempotent webhook processing via `processed_webhooks` table |
| 47 | Optimistic locking (`updated_at` check) for admin edits |
| 48 | `revalidatePath()` on every admin mutation |
| 49 | Inventory deducted on payment confirmation (webhook) -- never on checkout intent |

### Performance

| # | Rule |
|---|------|
| 50 | No animations on LCP elements |
| 51 | Lazy-load animation code below the fold |
| 52 | Virtual scrolling for lists > 50 items |
| 53 | ISR for public event pages (30s revalidate) |
| 54 | All images via Next.js `<Image>` (auto WebP/AVIF) |
| 55 | Fonts via `next/font` with `display: swap` |

### Accessibility

| # | Rule |
|---|------|
| 56 | Lighthouse accessibility score >= 90 in CI |
| 57 | All atoms and molecules pass axe-core tests |
| 58 | Focus visible at all times -- no `outline: none` without visible replacement |
| 59 | Touch targets minimum 44x44px on mobile |
| 60 | `prefers-reduced-motion` always respected |

### Security

| # | Rule |
|---|------|
| 61 | `service_role` key never on client -- server-only |
| 62 | Role guards on every Server Action (`requireRole()`) |
| 63 | Cloudflare Turnstile on public checkout forms |
| 64 | Audit log on every admin/staff action |
| 65 | Rate limit: max orders per email per event = 3 (configurable) |

### GDPR

| # | Rule |
|---|------|
| 66 | Cookie consent banner on all public pages |
| 67 | Data deletion capability (buyer request -> Super Admin executes) |
| 68 | EU data residency (Supabase Frankfurt) |
| 69 | Analytics anonymized after 26 months |
| 70 | Audit log retained for 2 years |
| 71 | Privacy policy and Terms of Service in EN, DE, and FR |

### Naming

| # | Rule |
|---|------|
| 72 | kebab-case for all files and directories |
| 73 | PascalCase for component exports |
| 74 | camelCase for function exports |
| 75 | SCREAMING_SNAKE_CASE for constants |
| 76 | snake_case for all database elements |
| 77 | `--dbc-{category}-{token}` for CSS variables |
| 78 | Dot-notation with camelCase leaves for i18n keys |

---

## 19. Performance Targets

| Page Type | Rendering | TTFB Target | LCP Target |
|-----------|-----------|-------------|------------|
| Event listing | ISR (revalidate: 60s) | < 100ms | < 1.5s |
| Event detail page | ISR (revalidate: 30s) | < 100ms | < 1.5s |
| Checkout flow | Server Actions | < 500ms response | < 2s |
| Admin dashboard | SSR (force-dynamic) | < 2s load | < 3s |
| QR scan page | Client component + Server Action | < 300ms scan-to-result | N/A |
| Order confirmation | SSR | < 500ms | < 2s |
| Post-event gallery | ISR (revalidate: 300s) | < 100ms | < 2s |

### Performance Rules

- All images via Next.js `<Image>` (auto WebP/AVIF, lazy loading)
- Fonts: `next/font` with `display: swap` (no FOUT)
- No animations on LCP elements (hero text/image loads instantly)
- Code splitting: each admin page is a separate chunk
- Supabase queries: named columns only, no `SELECT *`, pagination for lists
- Virtual scrolling for attendee lists > 50 items
- Lazy-load GSAP ScrollTrigger below the fold (dynamic import)
- `will-change` only on elements that actually animate
- Connection: Vercel Frankfurt -> Supabase Frankfurt = sub-5ms latency

### Bundle Size Targets

| Package | Max Size (gzipped) |
|---------|-------------------|
| Framer Motion | 30KB |
| GSAP + ScrollTrigger | 25KB (lazy-loaded) |
| html5-qrcode | 40KB (scan page only) |
| @react-pdf/renderer | 50KB (server-side only) |
| shadcn/ui atoms | Tree-shaken per page |
| next-intl | 10KB |

### Caching Strategy

| Resource | Cache | Revalidation |
|----------|-------|-------------|
| Event listing page | ISR | 60 seconds |
| Event detail page | ISR | 30 seconds |
| Static assets | CDN | Immutable (content hash) |
| Supabase queries (public) | SWR on client | On focus + 30s interval |
| Admin dashboard data | No cache | Always fresh (force-dynamic) |
| i18n messages | Build-time | On deploy |

---

## Appendix A: Database Schema Reference

Full schema defined in the architecture plan (Section 10). Key tables:

| Table | Purpose |
|-------|---------|
| `events` | Event metadata (trilingual), dates, venue, capacity, payment config |
| `event_schedule_items` | Agenda items with speakers |
| `ticket_tiers` | Per-event pricing tiers (trilingual), inventory tracking |
| `coupons` | Discount codes with validation rules |
| `orders` | Purchase records with status, payment method, totals |
| `tickets` | Individual attendee tickets with QR tokens |
| `profiles` | User profiles with role and locale |
| `staff_event_assignments` | Team member event scoping |
| `waitlist_entries` | FIFO waitlist queue |
| `event_email_sequences` | Post-event automated email config |
| `event_media` | Photos, videos, external links |
| `notifications` | In-app notification records |
| `audit_log` | All admin/staff action records |
| `analytics_events` | Custom event tracking |
| `kpi_snapshots` | Daily materialized KPI data |
| `processed_webhooks` | Stripe webhook idempotency |

---

## Appendix B: Monorepo Structure

```
dbcgermanyapps/
|-- apps/
|   |-- tickets/                    -> ticket.dbc-germany.com
|   |   |-- public/
|   |   |-- src/app/[locale]/
|   |   |   |-- page.tsx            (event listing)
|   |   |   |-- events/[slug]/      (rich event page)
|   |   |   |-- events/[slug]/gallery/  (post-event media)
|   |   |   |-- checkout/[slug]/    (checkout + coupon)
|   |   |   |-- confirmation/[orderId]/
|   |   |   |-- orders/             (buyer order history)
|   |   |   +-- transfer/[ticketId]/
|   |   |-- src/actions/
|   |   +-- src/app/api/webhooks/stripe/
|   |
|   +-- admin/                      -> admin.dbc-germany.com
|       |-- public/
|       |-- src/app/[locale]/
|       |   |-- login/
|       |   |-- dashboard/          (KPI overview)
|       |   |-- events/             (CRUD + tiers + coupons + schedule)
|       |   |-- events/[id]/attendees/
|       |   |-- events/[id]/media/
|       |   |-- events/[id]/emails/
|       |   |-- orders/             (all orders + refunds)
|       |   |-- tickets/send/       (single + bulk CSV)
|       |   |-- scan/               (QR scanner PWA)
|       |   |-- door-sale/
|       |   |-- staff/
|       |   |-- notifications/
|       |   |-- reports/
|       |   |-- audit-log/          (super admin only)
|       |   +-- settings/           (system + GDPR)
|       +-- middleware.ts
|
|-- packages/
|   |-- supabase/       -> typed client, guards, generated DB types
|   |-- i18n/           -> next-intl config, EN/DE/FR translations
|   |-- types/          -> shared TypeScript types (generated from DB)
|   |-- ui/             -> shadcn/ui + DBC brand tokens + shared components
|   |-- email/          -> React Email templates
|   +-- assets/         -> shared brand assets (logos, icons, fonts, images)
|
|-- turbo.json
|-- package.json
|-- pnpm-workspace.yaml
+-- ssot.md             -> this document
```

---

**End of SSOT. This document governs all architectural decisions across the DBC Germany ecosystem.
Any deviation requires an explicit amendment to this document with version increment.**
