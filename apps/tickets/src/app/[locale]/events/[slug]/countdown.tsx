"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function compute(target: Date): TimeLeft | null {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

export function Countdown({
  startsAt,
  locale: _locale,
}: {
  startsAt: string;
  locale: string;
}) {
  const target = new Date(startsAt);
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(compute(target));
  const t = useTranslations("tickets.events.countdown");

  useEffect(() => {
    const id = setInterval(() => {
      const next = compute(target);
      setTimeLeft(next);
      if (!next) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [target.getTime()]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!timeLeft) return null;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-5 py-3">
      <span className="text-xs font-semibold uppercase tracking-wider text-primary">
        {t("startsIn")}
      </span>
      <div className="flex gap-2 font-heading text-lg font-bold tabular-nums text-primary">
        {timeLeft.days > 0 && (
          <span>
            {timeLeft.days}
            <span className="text-xs font-normal">{t("days")}</span>
          </span>
        )}
        <span>
          {String(timeLeft.hours).padStart(2, "0")}
          <span className="text-xs font-normal">{t("hours")}</span>
        </span>
        <span>
          {String(timeLeft.minutes).padStart(2, "0")}
          <span className="text-xs font-normal">{t("minutes")}</span>
        </span>
        <span>
          {String(timeLeft.seconds).padStart(2, "0")}
          <span className="text-xs font-normal">{t("seconds")}</span>
        </span>
      </div>
    </div>
  );
}
