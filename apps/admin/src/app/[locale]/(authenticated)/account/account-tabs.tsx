"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  updateAccountProfile,
  updateAccountPreferences,
  uploadAccountAvatar,
  requestPasswordReset,
  signOutEverywhere,
  type AccountProfile,
} from "@/actions/account";

type Tab = "profile" | "preferences" | "security";

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "profile", label: "Profile" },
  { id: "preferences", label: "Preferences" },
  { id: "security", label: "Security" },
];

function initialsOf(name: string | null, email: string) {
  const source = name?.trim() || email;
  return source
    .split(/[\s@]+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function AccountTabs({ profile }: { profile: AccountProfile }) {
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
        {tab === "profile" && <ProfileTab profile={profile} />}
        {tab === "preferences" && <PreferencesTab profile={profile} />}
        {tab === "security" && <SecurityTab />}
      </div>
    </div>
  );
}

function ProfileTab({ profile }: { profile: AccountProfile }) {
  const [isPending, startTransition] = useTransition();
  const [avatarPending, startAvatarTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatar, setAvatar] = useState(profile.avatar_url);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateAccountProfile(formData);
      if ("error" in result) toast.error(result.error);
      else toast.success("Profile saved.");
    });
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    startAvatarTransition(async () => {
      const result = await uploadAccountAvatar(file);
      if ("error" in result) toast.error(result.error);
      else {
        setAvatar(result.url);
        toast.success("Avatar updated.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-border bg-primary/10 text-xl font-semibold text-primary">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            initialsOf(profile.display_name, profile.email)
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

      <label className="block">
        <span className="mb-1 block text-sm font-medium">Display name</span>
        <input
          type="text"
          name="display_name"
          defaultValue={profile.display_name ?? ""}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </label>

      <div className="rounded-md border border-border bg-muted/30 px-3 py-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Sign-in email
        </p>
        <p className="mt-1 text-sm">{profile.email}</p>
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

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateAccountPreferences(formData);
      if ("error" in result) toast.error(result.error);
      else toast.success("Preferences saved.");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Language</span>
        <select
          name="locale"
          defaultValue={profile.locale}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="en">English</option>
          <option value="de">Deutsch</option>
          <option value="fr">Français</option>
        </select>
      </label>

      <fieldset>
        <legend className="mb-1 block text-sm font-medium">Theme</legend>
        <div className="inline-flex rounded-md border border-border bg-background p-1">
          {(["light", "dark"] as const).map((t) => {
            const active = profile.theme === t;
            return (
              <label
                key={t}
                className={`cursor-pointer rounded px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <input
                  type="radio"
                  name="theme"
                  value={t}
                  defaultChecked={active}
                  className="sr-only"
                />
                {t}
              </label>
            );
          })}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          The app follows your system theme until you pick one here.
        </p>
      </fieldset>

      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          name="email_notifications"
          defaultChecked={profile.email_notifications}
          className="mt-1 h-4 w-4"
        />
        <span>
          <span className="block text-sm font-medium">
            Email notifications
          </span>
          <span className="block text-xs text-muted-foreground">
            Transactional alerts for orders, applications, and system events
            you&apos;re responsible for.
          </span>
        </span>
      </label>

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

function SecurityTab() {
  const [resetPending, startResetTransition] = useTransition();
  const [soePending, startSoeTransition] = useTransition();

  function handleReset() {
    startResetTransition(async () => {
      const result = await requestPasswordReset();
      if ("error" in result) toast.error(result.error);
      else
        toast.success(
          "Password-reset link sent to your email.",
          { description: "Check your inbox." }
        );
    });
  }

  function handleSignOutEverywhere() {
    startSoeTransition(async () => {
      const result = await signOutEverywhere();
      if ("error" in result) toast.error(result.error);
      else toast.success("Signed out on all devices.");
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-md border border-border p-4">
        <h3 className="font-heading text-base font-bold">Password</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          We&apos;ll email you a secure reset link.
        </p>
        <button
          type="button"
          onClick={handleReset}
          disabled={resetPending}
          className="mt-3 rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
        >
          {resetPending ? "Sending…" : "Send password-reset email"}
        </button>
      </div>

      <div className="rounded-md border border-border p-4">
        <h3 className="font-heading text-base font-bold">Sessions</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign out of every browser and device you&apos;re currently logged in
          on.
        </p>
        <button
          type="button"
          onClick={handleSignOutEverywhere}
          disabled={soePending}
          className="mt-3 rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
        >
          {soePending ? "Signing out…" : "Sign out everywhere"}
        </button>
      </div>
    </div>
  );
}
