"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, Input, Label, Select } from "@dbc/ui";
import { createAffiliateAction } from "@/actions/affiliates";

export function AffiliatesIndexActions() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [locale, setLocale] = useState<"en" | "de" | "fr">("en");
  const [country, setCountry] = useState("");
  const [notes, setNotes] = useState("");

  function submit() {
    if (!firstName.trim() || !email.trim()) {
      toast.error("First name and email are required");
      return;
    }
    startTransition(async () => {
      try {
        const row = await createAffiliateAction({
          first_name: firstName.trim(),
          last_name: lastName.trim() || null,
          contact_email: email.trim(),
          preferred_locale: locale,
          country: country.trim() || null,
          notes: notes.trim() || null,
        });
        toast.success("Affiliate created");
        setOpen(false);
        setFirstName("");
        setLastName("");
        setEmail("");
        setCountry("");
        setNotes("");
        router.refresh();
        router.push(
          `/${window.location.pathname.split("/")[1]}/affiliates/${row.id}`
        );
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>New affiliate</Button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-20"
          onClick={() => !pending && setOpen(false)}
        >
          <div
            className="max-h-[calc(100vh-6rem)] w-full max-w-md overflow-y-auto rounded-lg border border-border bg-background p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-heading text-lg font-bold">New affiliate</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Creates the affiliate record. They&rsquo;ll get a welcome email
              once you enroll them in a specific event.
            </p>
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label>First name</Label>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Esther"
                  />
                </div>
                <div>
                  <Label>Last name</Label>
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Tshipama"
                  />
                </div>
              </div>
              <div>
                <Label>Contact email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="esther@example.com"
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label>Locale</Label>
                  <Select
                    value={locale}
                    onChange={(e) =>
                      setLocale(e.target.value as "en" | "de" | "fr")
                    }
                  >
                    <option value="en">English</option>
                    <option value="de">Deutsch</option>
                    <option value="fr">Français</option>
                  </Select>
                </div>
                <div>
                  <Label>Country (optional)</Label>
                  <Input
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="DE"
                  />
                </div>
              </div>
              <div>
                <Label>Notes (offline payment refs, etc.)</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button onClick={submit} disabled={pending}>
                {pending ? "Creating…" : "Create"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
