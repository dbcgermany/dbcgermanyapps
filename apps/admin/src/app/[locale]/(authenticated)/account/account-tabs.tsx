"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { AddressFields, Button, DatePicker, EMPTY_ADDRESS, PhoneInput, Toggle, type Address } from "@dbc/ui";
import {
  updateAccountProfile,
  updateAccountPreferences,
  uploadAccountAvatar,
  type AccountProfile,
} from "@/actions/account";
import { SecurityTab } from "./security-tab";

type Tab = "profile" | "preferences" | "security";

const T = {
  en: {
    profile: "Profile", preferences: "Preferences", security: "Security",
    changeAvatar: "Change avatar", uploading: "Uploading…",
    avatarHint: "JPG, PNG, WebP up to 50 MB — auto-converted to WebP.",
    firstName: "First name", lastName: "Last name",
    signInEmail: "Sign-in email", birthday: "Birthday", phone: "Phone",
    address: "Address", clearAddress: "Clear address",
    saving: "Saving…", saveProfile: "Save profile", savePrefs: "Save preferences",
    profileSaved: "Profile saved.", prefsSaved: "Preferences saved.",
    avatarUpdated: "Avatar updated.",
    language: "Language", theme: "Theme", light: "Light", dark: "Dark",
    emailNotifs: "Email notifications",
    emailNotifsHelp: "Transactional alerts for orders, applications, and system events you’re responsible for.",
  },
  de: {
    profile: "Profil", preferences: "Einstellungen", security: "Sicherheit",
    changeAvatar: "Profilbild ändern", uploading: "Wird hochgeladen…",
    avatarHint: "JPG, PNG, WebP bis 50 MB — wird automatisch in WebP umgewandelt.",
    firstName: "Vorname", lastName: "Nachname",
    signInEmail: "Anmelde-E-Mail", birthday: "Geburtstag", phone: "Telefon",
    address: "Adresse", clearAddress: "Adresse leeren",
    saving: "Wird gespeichert…", saveProfile: "Profil speichern", savePrefs: "Einstellungen speichern",
    profileSaved: "Profil gespeichert.", prefsSaved: "Einstellungen gespeichert.",
    avatarUpdated: "Profilbild aktualisiert.",
    language: "Sprache", theme: "Design", light: "Hell", dark: "Dunkel",
    emailNotifs: "E-Mail-Benachrichtigungen",
    emailNotifsHelp: "Transaktionshinweise zu Bestellungen, Bewerbungen und Systemereignissen, für die Sie zuständig sind.",
  },
  fr: {
    profile: "Profil", preferences: "Préférences", security: "Sécurité",
    changeAvatar: "Changer d’avatar", uploading: "Téléversement…",
    avatarHint: "JPG, PNG, WebP jusqu’à 50 Mo — converti automatiquement en WebP.",
    firstName: "Prénom", lastName: "Nom",
    signInEmail: "E-mail de connexion", birthday: "Date de naissance", phone: "Téléphone",
    address: "Adresse", clearAddress: "Effacer l’adresse",
    saving: "Enregistrement…", saveProfile: "Enregistrer le profil", savePrefs: "Enregistrer les préférences",
    profileSaved: "Profil enregistré.", prefsSaved: "Préférences enregistrées.",
    avatarUpdated: "Avatar mis à jour.",
    language: "Langue", theme: "Thème", light: "Clair", dark: "Sombre",
    emailNotifs: "Notifications e-mail",
    emailNotifsHelp: "Alertes transactionnelles pour les commandes, candidatures et événements système dont vous êtes responsable.",
  },
} as const;

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
  const tab = (["profile", "preferences", "security"] as const).includes(current as Tab) ? current : "profile";
  const t = T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof T];
  const tabItems: Array<[Tab, string]> = [
    ["profile", t.profile],
    ["preferences", t.preferences],
    ["security", t.security],
  ];

  function setTab(tabId: Tab) {
    const sp = new URLSearchParams(params);
    sp.set("tab", tabId);
    router.replace(`${pathname}?${sp.toString()}`);
  }

  return (
    <div className="mt-8">
      <div className="flex gap-1 border-b border-border">
        {tabItems.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-t-md border-b-2 px-4 py-2 text-sm font-medium ${
              tab === id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6 max-w-3xl">
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
  const t = T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof T];

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
      else toast.success(t.profileSaved);
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
        toast.success(t.avatarUpdated);
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
            {avatarPending ? t.uploading : t.changeAvatar}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {t.avatarHint}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">
            {t.firstName}<span className="ml-0.5 text-red-500">*</span>
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
          <span className="mb-1 block text-sm font-medium">{t.lastName}</span>
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
          {t.signInEmail}
        </p>
        <p className="mt-1 text-sm">{profile.email}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">{t.birthday}</span>
          <DatePicker value={birthday} onChange={setBirthday} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">{t.phone}</span>
          <PhoneInput value={phone} onChange={setPhone} />
        </label>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">{t.address}</h3>
          {(address.line1 || address.city || address.country) && (
            <button
              type="button"
              onClick={resetAddress}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {t.clearAddress}
            </button>
          )}
        </div>
        <AddressFields value={address} onChange={setAddress} locale={locale} />
      </div>

      <div className="flex justify-end">
        <Button type="submit"
          disabled={isPending}>
          {isPending ? t.saving : t.saveProfile}
        </Button>
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
  const t = T[(profile.locale === "de" || profile.locale === "fr" ? profile.locale : "en") as keyof typeof T];

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
        toast.success(t.prefsSaved);
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
        <span className="mb-1 block text-sm font-medium">{t.language}</span>
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
        <p className="mb-2 block text-sm font-medium">{t.theme}</p>
        <div className="inline-flex rounded-md border border-border bg-background p-1">
          {(["light", "dark"] as const).map((v) => {
            const active = theme === v;
            return (
              <button
                type="button"
                key={v}
                onClick={() => setTheme(v)}
                className={`rounded px-4 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {v === "light" ? t.light : t.dark}
              </button>
            );
          })}
        </div>
      </div>

      <Toggle
        checked={emailNotifs}
        onChange={setEmailNotifs}
        label={t.emailNotifs}
        description={t.emailNotifsHelp}
      />

      <div className="flex justify-end">
        <Button type="submit"
          disabled={isPending}>
          {isPending ? t.saving : t.savePrefs}
        </Button>
      </div>
    </form>
  );
}
