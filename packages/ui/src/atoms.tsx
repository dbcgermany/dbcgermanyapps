"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./utils";

/* -------------------------------------------------------------------------- */
/*                                   Button                                   */
/* -------------------------------------------------------------------------- */

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap",
  {
    variants: {
      variant: {
        // No shadow on filled variants — on dark surfaces the 1 px shadow
        // halos out and reads as a rendering glitch. The bg-primary fill
        // carries enough weight on its own.
        primary:
          "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary:
          "border border-border bg-background text-foreground hover:bg-muted",
        ghost: "text-foreground hover:bg-muted",
        destructive:
          "border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20",
        accent:
          "bg-accent text-accent-foreground hover:bg-accent/90",
      },
      size: {
        // Tuned to match the original "good" pill — clean, tighter, no
        // shadow halo. md is 40 px (h-10 + px-5), reads as a primary CTA
        // without dominating the row.
        sm: "h-9  px-4 text-xs",
        md: "h-10 px-5 text-sm",
        lg: "h-12 px-7 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ className, variant, size, ...props }, ref) {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);

export type LinkButtonProps = React.AnchorHTMLAttributes<HTMLAnchorElement> &
  VariantProps<typeof buttonVariants>;

/** Styled anchor that matches Button — use for links that look like buttons. */
export const LinkButton = React.forwardRef<HTMLAnchorElement, LinkButtonProps>(
  function LinkButton({ className, variant, size, ...props }, ref) {
    return (
      <a
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);

export { buttonVariants };

/* -------------------------------------------------------------------------- */
/*                                    Card                                    */
/* -------------------------------------------------------------------------- */

const cardVariants = cva("rounded-2xl border border-border bg-card", {
  variants: {
    padding: {
      none: "",
      sm: "p-4",
      md: "p-6",
      lg: "p-8",
    },
    elevated: {
      true: "shadow-sm",
      false: "",
    },
  },
  defaultVariants: { padding: "md", elevated: false },
});

export type CardProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof cardVariants>;

export function Card({
  className,
  padding,
  elevated,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(cardVariants({ padding, elevated }), className)}
      {...props}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*                                   Input                                    */
/* -------------------------------------------------------------------------- */

const inputVariants = cva(
  "w-full rounded-md border bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      size: {
        sm: "h-9 py-1.5",
        md: "h-11 py-2",
        lg: "h-12 py-2.5 text-base",
      },
      state: {
        default: "border-input",
        error: "border-red-400 focus:ring-red-400",
        disabled: "border-input bg-muted",
      },
    },
    defaultVariants: { size: "md", state: "default" },
  }
);

export type InputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "size"
> &
  VariantProps<typeof inputVariants>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ className, size, state, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(inputVariants({ size, state }), className)}
        {...props}
      />
    );
  }
);

/* -------------------------------------------------------------------------- */
/*                                  Textarea                                  */
/* -------------------------------------------------------------------------- */

const textareaVariants = cva(
  "w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      state: {
        default: "border-input",
        error: "border-red-400 focus:ring-red-400",
        disabled: "border-input bg-muted",
      },
    },
    defaultVariants: { state: "default" },
  }
);

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> &
  VariantProps<typeof textareaVariants>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, state, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(textareaVariants({ state }), className)}
        {...props}
      />
    );
  }
);

/* -------------------------------------------------------------------------- */
/*                                  Select                                    */
/* -------------------------------------------------------------------------- */
// Native <select> in the same visual language as Input. Every admin page
// that used to hand-roll `<select className="rounded-md border…">` should
// import this instead so the focus ring, height, and chevron stay in sync
// across the dashboard.

const selectVariants = cva(
  "w-full appearance-none rounded-md border bg-background pl-3 pr-9 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      size: {
        sm: "h-9 text-xs",
        md: "h-11",
        lg: "h-12 text-base",
      },
      state: {
        default: "border-input",
        error: "border-red-400 focus:ring-red-400",
        disabled: "border-input bg-muted",
      },
    },
    defaultVariants: { size: "md", state: "default" },
  }
);

/** Compact inline SVG chevron, baked into the select via `background-image`
 *  so the native OS dropdown arrow stays suppressed (appearance: none) and
 *  we get the same glyph in light and dark mode. */
const SELECT_CHEVRON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23737373' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E\")";

export type SelectProps = Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  "size"
> &
  VariantProps<typeof selectVariants>;

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ className, size, state, style, ...props }, ref) {
    return (
      <select
        ref={ref}
        className={cn(selectVariants({ size, state }), className)}
        style={{
          backgroundImage: SELECT_CHEVRON,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 0.75rem center",
          backgroundSize: "1rem 1rem",
          ...style,
        }}
        {...props}
      />
    );
  }
);

/* -------------------------------------------------------------------------- */
/*                                    Label                                   */
/* -------------------------------------------------------------------------- */

export function Label({
  className,
  required,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label
      className={cn("mb-1 block text-sm font-medium text-foreground", className)}
      {...props}
    >
      {children}
      {required && (
        <span aria-hidden className="ml-0.5 text-red-500">
          *
        </span>
      )}
    </label>
  );
}

/* -------------------------------------------------------------------------- */
/*                                    Badge                                   */
/* -------------------------------------------------------------------------- */

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "bg-muted text-muted-foreground",
        success:
          "bg-[var(--dbc-color-success-bg)] text-[var(--dbc-color-success-text)]",
        warning:
          "bg-[var(--dbc-color-warning-bg)] text-[var(--dbc-color-warning-text)]",
        error:
          "bg-[var(--dbc-color-error-bg)] text-[var(--dbc-color-error-text)]",
        info:
          "bg-[var(--dbc-color-info-bg)] text-[var(--dbc-color-info-text)]",
        accent: "bg-primary/10 text-primary",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Heading                                   */
/* -------------------------------------------------------------------------- */

type HeadingLevel = 1 | 2 | 3 | 4;

const headingStyles: Record<HeadingLevel, string> = {
  1: "font-heading text-4xl font-bold tracking-tight sm:text-5xl",
  2: "font-heading text-2xl font-bold tracking-tight sm:text-3xl",
  3: "font-heading text-xl font-bold",
  4: "font-heading text-lg font-bold",
};

export function Heading({
  level = 2,
  className,
  children,
  as,
  ...props
}: {
  level?: HeadingLevel;
  as?: "h1" | "h2" | "h3" | "h4";
  className?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLHeadingElement>) {
  const Tag = (as ?? (`h${level}` as const)) as React.ElementType;
  return (
    <Tag className={cn(headingStyles[level], className)} {...props}>
      {children}
    </Tag>
  );
}

export function Eyebrow({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "text-xs font-semibold uppercase tracking-wider text-primary",
        className
      )}
      {...props}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Section                                   */
/* -------------------------------------------------------------------------- */

/** Layout wrapper that centers content and applies vertical rhythm. */
export function Section({
  className,
  size = "md",
  children,
  ...props
}: {
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLElement>) {
  const pad =
    size === "sm"
      ? "py-12 sm:py-16"
      : size === "lg"
        ? "py-24 sm:py-32"
        : "py-20 sm:py-28";
  return (
    <section className={cn(pad, className)} {...props}>
      {children}
    </section>
  );
}

export function Container({
  className,
  max = "5xl",
  ...props
}: {
  max?: "3xl" | "4xl" | "5xl" | "6xl" | "7xl";
} & React.HTMLAttributes<HTMLDivElement>) {
  const maxW = {
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
    "6xl": "max-w-6xl",
    "7xl": "max-w-7xl",
  }[max];
  return (
    <div
      className={cn("mx-auto px-4 sm:px-6 lg:px-8", maxW, className)}
      {...props}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*                                 FormField                                  */
/* -------------------------------------------------------------------------- */

export function FormField({
  label,
  required,
  error,
  hint,
  children,
}: {
  label?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      {label && <Label required={required}>{label}</Label>}
      {children}
      {error ? (
        <p className="mt-1 text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
