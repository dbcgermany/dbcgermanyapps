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
import { Card } from "@dbc/ui";

/**
 * DBC brand palette for charts. Primary red anchors everything; supporting
 * hues picked to be distinguishable and readable in both light and dark mode.
 */
export const CHART_COLORS = [
  "#c8102e", // DBC primary red
  "#d4a017", // DBC accent gold
  "#0ea5e9", // Sky blue
  "#16a34a", // Green
  "#a855f7", // Purple
  "#f59e0b", // Orange
  "#64748b", // Slate
  "#ec4899", // Pink
];

const AXIS_STYLE = {
  fontSize: 11,
  fill: "currentColor",
  opacity: 0.6,
};

const TOOLTIP_STYLE: React.CSSProperties = {
  background: "var(--color-card, #ffffff)",
  border: "1px solid var(--color-border, #e5e5e5)",
  borderRadius: 8,
  padding: "8px 12px",
  fontSize: 12,
  boxShadow: "0 1px 3px rgba(0,0,0,.08)",
  color: "var(--color-foreground, #111111)",
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
        stroke="var(--color-card, #ffffff)"
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
