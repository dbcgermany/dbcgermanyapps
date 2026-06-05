"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { FormField, Select } from "@dbc/ui";
import { getPillarOptions } from "@/actions/news";

/**
 * Mark a post as a pillar, or assign it to a parent pillar (cluster). Emits
 * `is_pillar` (checkbox) + `pillar_id` (select). A pillar has no parent, so
 * the select is hidden when "is pillar" is checked.
 */
export function NewsPillarPicker({
  currentId,
  isPillar = false,
  pillarId = null,
}: {
  currentId?: string;
  isPillar?: boolean;
  pillarId?: string | null;
}) {
  const t = useTranslations("admin.news.editor");
  const [pillar, setPillar] = useState(isPillar);
  const [options, setOptions] = useState<{ id: string; title_en: string }[]>([]);

  useEffect(() => {
    let active = true;
    getPillarOptions(currentId).then((o) => active && setOptions(o));
    return () => {
      active = false;
    };
  }, [currentId]);

  return (
    <FormField label={t("pillar")}>
      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="is_pillar"
          checked={pillar}
          onChange={(e) => setPillar(e.target.checked)}
          className="h-4 w-4 rounded border-input"
        />
        {t("isPillar")}
      </label>
      {!pillar && (
        <Select name="pillar_id" defaultValue={pillarId ?? ""} className="mt-2">
          <option value="">{t("noPillar")}</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.title_en}
            </option>
          ))}
        </Select>
      )}
    </FormField>
  );
}
