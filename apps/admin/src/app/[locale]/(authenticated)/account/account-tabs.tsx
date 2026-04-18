"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Toggle,
  DatePicker,
  AddressFields,
  PhoneInput,
  EMPTY_ADDRESS,
  type Address,
} from "@dbc/ui";
import {
  updateAccountProfile,
  updateAccountPreferences,
  uploadAccountAvatar,
  type AccountProfile,
} from "@/actions/account";
import { SecurityTab } from "./security-tab";

type Tab = "profile" | "preferences" | "security";

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "profile", label: "Profile" },
  { id: "preferences", label: "Preferences" },
  { id: "security", label: "Security" },
];

function initialsOf(firstName: string | null, lastName: string | null, email: string) {
  const source =
    (firstName || "").trim() + " " + (lastName || "").trim();
  if (source.trim()) {
    return source
      .split(/\s+/)
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }
  return email
    .split(/[\s@]+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function AccountTabs({
  profile,
  locale,
}: {
  profile: AccountProfile;
  locale: string;
}) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const current = (params.get("tab") as Tab) || "profile";
  const tab = TABS.some((t) => t.id === current) ? current : "profile";

  function setTab(t: Tab) {
    const sp = new URLSearchParams(params);
    sp.set("tab", t);
    router.replace(`${pathname}?${sp.toString()}`);
  }

  return (
    <div className="mt-8">
      <div className="flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-t-md border-b-2 px-4 py-2 text-sm font-medium ${
              tab === t.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6 max-w-2xl">
        {tab === "profile" && <ProfileTab profile={profile} locale={locale} />}
        {tab === "preferences" && <PreferencesTab profile={profile} />}
        {tab === "security" && <SecurityTab />}
      </div>
    </div>
  );
}

function ProfileTab({
  profile,
  locale,
}: {
  profile: AccountProfile;
  locale: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [avatarPending, startAvatarTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatar, setAvatar] = useState(profile.avatar_url);

  const [firstName, setFirstName] = useState(profile.first_name ?? "");
  const [lastName, setLastName] = useState(profile.last_name ?? "");
  const [birthday, setBirthday] = useState<string | null>(profile.birthday);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [address, setAddress] = useState<Address>({
    line1: profile.address_line1 ?? "",
    line2: profile.address_line2 ?? "",
    city: profile.address_city ?? "",
    state: profile.address_state ?? "",
    postal_code: profile.address_postal_code ?? "",
    country: profile.address_country ?? "",
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateAccountProfile({
        first_name: firstName,
        last_name: lastName,
        birthday,
        phone: phone || null,
        address_line1: address.line1 || null,
        address_line2: address.line2 || null,
        address_city: address.city || null,
        address_state: address.state || null,
        address_postal_code: address.postal_code || null,
        address_country: address.country || null,
      });
      if ("error" in result && result.error) toast.error(result.error);
      else toast.success("Profile saved.");
    });
  }

  function resetAddress() {
    setAddress(EMPTY_ADDRESS);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    startAvatarTransition(async () => {
      const result = await uploadAccountAvatar(file);
      if ("error" in result && result.error) toast.error(result.error);
      else if ("url" in result && result.url) {
        setAvatar(result.url);
        toast.success("Avatar updated.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-border bg-primary/10 text-xl font-semibold text-primary">
          {avatar ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            initialsOf(firstName, lastName, profile.email)
          )}
        </div>
        <div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={avatarPending}
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
          >
            {avatarPending ? "Uploading…" : "Change avatar"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            JPG, PNG, WebP, up to 2 MB.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">
            First name<span className="ml-0.5 text-red-500">*</span>
          </span>
          <input
            type="text"
            required
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Last name</span>
          <input
            type="text"
            autoComplete="family-name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
      </div>

      <div className="rounded-md border border-border bg-muted/30 px-3 py-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Sign-in email
        </p>
        <p className="mt-1 text-sm">{profile.email}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Birthday</span>
          <DatePicker value={birthday} onChange={setBirthday} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Phone</span>
          <PhoneInput value={phone} onChange={setPhone} />
        </label>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Address</h3>
          {(address.line1 || address.city || address.country) && (
            <button
              type="button"
              onClick={resetAddress}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear address
            </button>
          )}
        </div>
        <AddressFields value={address} onChange={setAddress} locale={locale} />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Save profile"}
        </button>
      </div>
    </form>
  );
}

function PreferencesTab({ profile }: { profile: AccountProfile }) {
  const [isPending, startTransition] = useTransition();
  const [locale, setLocale] = useState(profile.locale);
  const [theme, setTheme] = useState<"light" | "dark">(
    profile.theme === "dark" ? "dark" : "light"
  );
  const [emailNotifs, setEmailNotifs] = useState(profile.email_notifications);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateAccountPreferences({
        locale,
        theme,
        email_notifications: emailNotifs,
      });
      if ("error" in result && result.error) toast.error(result.error);
      else {
        toast.success("Preferences saved.");
        // Apply theme immediately without a full reload and persist in both
        // cookie (so the SSR layout picks it up on the next request) and
        // localStorage (so the ThemeProvider stays in sync).
        if (typeof document !== "undefined") {
          document.documentElement.dataset.theme = theme;
          document.documentElement.classList.toggle("dark", theme === "dark");
          document.cookie = `dbc-theme=${theme}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
          try {
            localStorage.setItem("dbc-theme", theme);
          } catch {
            /* Safari private mode */
          }
        }
        // If the locale changed, navigate to the matching URL segment so
        // server components (and next-intl) re-render in the new language.
        // Full reload — not router.push — so the NextIntlClientProvider
        // receives fresh messages from the server layout.
        if (typeof window !== "undefined") {
          const segments = window.location.pathname.split("/");
          const current = segments[1];
          if (current && current !== locale) {
            segments[1] = locale;
            window.location.assign(segments.join("/") + window.location.search);
          }
        }
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Language</span>
        <select
          value={locale}
          onChange={(e) => setLocale(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="en">English</option>
          <option value="de">Deutsch</option>
          <option value="fr">Français</option>
        </select>
      </label>

      <div>
        <p className="mb-2 block text-sm font-medium">Theme</p>
        <div className="inline-flex rounded-md border border-border bg-background p-1">
          {(["light", "dark"] as const).map((v) => {
            const active = theme === v;
            return (
              <button
                type="button"
                key={v}
                onClick={() => setTheme(v)}
                className={`rounded px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {v}
              </button>
            );
          })}
        </div>
      </div>

      <Toggle
        checked={emailNotifs}
        onChange={setEmailNotifs}
        label="Email notifications"
        description="Transactional alerts for orders, applications, and system events you’re responsible for."
      />

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Save preferences"}
        </button>
      </div>
    </form>
  );
}
