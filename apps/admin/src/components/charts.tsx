"use client";

import {
  Area,
  AreaChart as RAreaChart,
  Bar,
  BarChart as RBarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart as RLineChart,
  Pie,
  PieChart as RPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, BRAND_HEX } from "@dbc/ui";

/**
 * Chart series palette. The first six entries are the brand-aligned
 * colors (primary, accent, plus the four alert tokens) — sourced from
 * BRAND_HEX so any token change in `tokens/base.css` propagates
 * automatically. The two trailing entries are an SSOT-acknowledged
 * extension for high-cardinality charts where the brand-aligned six
 * are exhausted; chart series colors are decorative-by-necessity.
 *
 * If a series count exceeds 8, switch to a categorical encoding
 * (icons, patterns) rather than adding more colors.
 */
export const CHART_COLORS = [
  BRAND_HEX.red,
  BRAND_HEX.gold,
  BRAND_HEX.info,
  BRAND_HEX.success,
  BRAND_HEX.warning,
  BRAND_HEX.error,
  "#a855f7", // Extended series (purple) — see comment above
  "#ec4899", // Extended series (pink) — see comment above
];

const AXIS_STYLE = {
  fontSize: 11,
  fill: "currentColor",
  opacity: 0.6,
};

// Inline styles need string colours; var() falls back to a hex literal
// so the chart still renders during SSR / before the stylesheet hydrates.
// The hex values mirror tokens/base.css.
const TOOLTIP_STYLE: React.CSSProperties = {
  background: `var(--color-card, ${BRAND_HEX.paper})`,
  border: `1px solid var(--color-border, ${BRAND_HEX.border})`,
  borderRadius: 8,
  padding: "8px 12px",
  fontSize: 12,
  boxShadow: "0 1px 3px rgba(0,0,0,.08)",
  color: `var(--color-foreground, ${BRAND_HEX.ink})`,
};

// ---------------------------------------------------------------------------
// Shared card chrome
// ---------------------------------------------------------------------------

export function ChartCard({
  title,
  description,
  children,
  height = 280,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  height?: number;
}) {
  return (
    <Card padding="md" className="rounded-lg">
      <div className="mb-3">
        <h3 className="font-heading text-sm font-semibold">{title}</h3>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer width="100%" height="100%">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {children as any}
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Line chart (trends, time series)
// ---------------------------------------------------------------------------

export interface LineChartProps {
  data: Array<Record<string, string | number>>;
  xKey: string;
  series: Array<{ key: string; label?: string; color?: string }>;
  yFormatter?: (v: number) => string;
}

export function LineChart({ data, xKey, series, yFormatter }: LineChartProps) {
  return (
    <RLineChart data={data} margin={{ top: 6, right: 8, left: -8, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.08} />
      <XAxis dataKey={xKey} tick={AXIS_STYLE} tickLine={false} axisLine={false} />
      <YAxis tick={AXIS_STYLE} tickLine={false} axisLine={false} tickFormatter={yFormatter} />
      <Tooltip
        contentStyle={TOOLTIP_STYLE}
        formatter={
          yFormatter
            ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ((v: any) => yFormatter(Number(v))) as any
            : undefined
        }
      />
      {series.map((s, i) => (
        <Line
          key={s.key}
          type="monotone"
          dataKey={s.key}
          name={s.label || s.key}
          stroke={s.color || CHART_COLORS[i % CHART_COLORS.length]}
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
      ))}
    </RLineChart>
  );
}

// ---------------------------------------------------------------------------
// Area chart (volume / cumulative trends)
// ---------------------------------------------------------------------------

export function AreaChart({ data, xKey, series, yFormatter }: LineChartProps) {
  return (
    <RAreaChart data={data} margin={{ top: 6, right: 8, left: -8, bottom: 0 }}>
      <defs>
        {series.map((s, i) => {
          const color = s.color || CHART_COLORS[i % CHART_COLORS.length];
          return (
            <linearGradient key={s.key} id={`area-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.35} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          );
        })}
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.08} />
      <XAxis dataKey={xKey} tick={AXIS_STYLE} tickLine={false} axisLine={false} />
      <YAxis tick={AXIS_STYLE} tickLine={false} axisLine={false} tickFormatter={yFormatter} />
      <Tooltip
        contentStyle={TOOLTIP_STYLE}
        formatter={
          yFormatter
            ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ((v: any) => yFormatter(Number(v))) as any
            : undefined
        }
      />
      {series.map((s, i) => {
        const color = s.color || CHART_COLORS[i % CHART_COLORS.length];
        return (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label || s.key}
            stroke={color}
            strokeWidth={2}
            fill={`url(#area-${s.key})`}
          />
        );
      })}
    </RAreaChart>
  );
}

// ---------------------------------------------------------------------------
// Bar chart (compare categories)
// ---------------------------------------------------------------------------

export interface BarChartProps {
  data: Array<Record<string, string | number>>;
  xKey: string;
  series: Array<{ key: string; label?: string; color?: string }>;
  yFormatter?: (v: number) => string;
  horizontal?: boolean;
  stacked?: boolean;
}

export function BarChart({
  data,
  xKey,
  series,
  yFormatter,
  horizontal,
  stacked,
}: BarChartProps) {
  return (
    <RBarChart
      data={data}
      layout={horizontal ? "vertical" : "horizontal"}
      margin={{ top: 6, right: 8, left: horizontal ? 40 : -8, bottom: 0 }}
    >
      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.08} />
      {horizontal ? (
        <>
          <XAxis type="number" tick={AXIS_STYLE} tickLine={false} axisLine={false} tickFormatter={yFormatter} />
          <YAxis type="category" dataKey={xKey} tick={AXIS_STYLE} tickLine={false} axisLine={false} width={100} />
        </>
      ) : (
        <>
          <XAxis dataKey={xKey} tick={AXIS_STYLE} tickLine={false} axisLine={false} />
          <YAxis tick={AXIS_STYLE} tickLine={false} axisLine={false} tickFormatter={yFormatter} />
        </>
      )}
      <Tooltip
        contentStyle={TOOLTIP_STYLE}
        formatter={
          yFormatter
            ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ((v: any) => yFormatter(Number(v))) as any
            : undefined
        }
        cursor={{ fill: "currentColor", opacity: 0.04 }}
      />
      {series.map((s, i) => (
        <Bar
          key={s.key}
          dataKey={s.key}
          name={s.label || s.key}
          fill={s.color || CHART_COLORS[i % CHART_COLORS.length]}
          radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
          stackId={stacked ? "stack" : undefined}
        />
      ))}
    </RBarChart>
  );
}

// ---------------------------------------------------------------------------
// Donut chart (proportions, often with center metric)
// ---------------------------------------------------------------------------

export interface DonutChartProps {
  data: Array<{ name: string; value: number; color?: string }>;
  centerLabel?: string;
  centerValue?: string;
  valueFormatter?: (v: number) => string;
}

export function DonutChart({
  data,
  centerLabel,
  centerValue,
  valueFormatter,
}: DonutChartProps) {
  return (
    <RPieChart>
      <Pie
        data={data}
        dataKey="value"
        nameKey="name"
        cx="50%"
        cy="50%"
        innerRadius="60%"
        outerRadius="85%"
        paddingAngle={2}
        stroke={`var(--color-card, ${BRAND_HEX.paper})`}
        strokeWidth={2}
      >
        {data.map((entry, i) => (
          <Cell
            key={entry.name}
            fill={entry.color || CHART_COLORS[i % CHART_COLORS.length]}
          />
        ))}
      </Pie>
      <Tooltip
        contentStyle={TOOLTIP_STYLE}
        formatter={
          valueFormatter
            ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ((v: any) => valueFormatter(Number(v))) as any
            : undefined
        }
      />
      {(centerValue || centerLabel) && (
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ pointerEvents: "none" }}
        >
          {centerValue && (
            <tspan
              x="50%"
              dy="-0.3em"
              style={{
                fontSize: 20,
                fontWeight: 700,
                fill: "currentColor",
              }}
            >
              {centerValue}
            </tspan>
          )}
          {centerLabel && (
            <tspan
              x="50%"
              dy="1.4em"
              style={{
                fontSize: 10,
                fill: "currentColor",
                opacity: 0.6,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {centerLabel}
            </tspan>
          )}
        </text>
      )}
    </RPieChart>
  );
}

// ---------------------------------------------------------------------------
// Legend chip row (reusable for donut/pie/bar explanations)
// ---------------------------------------------------------------------------

export function ChartLegend({
  items,
}: {
  items: Array<{ name: string; color: string; value?: string }>;
}) {
  return (
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
      {items.map((item) => (
        <div key={item.name} className="flex items-center gap-1.5 text-xs">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-sm"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-muted-foreground">{item.name}</span>
          {item.value && (
            <span className="font-medium text-foreground">{item.value}</span>
          )}
        </div>
      ))}
    </div>
  );
}
