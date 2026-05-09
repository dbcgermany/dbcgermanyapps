import { geoEqualEarth, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { FeatureCollection } from "geojson";
import type { Topology } from "topojson-specification";
import worldData from "@/lib/world-110m.json";

// Three DBC offices, in the order shown on /about. Coordinates are
// [longitude, latitude].
const OFFICES: Array<{ name: string; coordinates: [number, number] }> = [
  { name: "Lubumbashi", coordinates: [27.4794, -11.6647] },
  { name: "Düsseldorf", coordinates: [6.7735, 51.2277] },
  { name: "Herblay-sur-Seine", coordinates: [2.1633, 49.0067] },
];

// Server-side geometry build. d3-geo's geoEqualEarth projects lon/lat
// to viewport coordinates; geoPath turns each country geometry into an
// SVG `d` string. Both run once at module load — no JS hydration cost.
const VIEW_W = 800;
const VIEW_H = 420;

const topology = worldData as unknown as Topology;
const countries = feature(
  topology,
  topology.objects.countries,
) as unknown as FeatureCollection;

const projection = geoEqualEarth().fitSize([VIEW_W, VIEW_H], countries);
const pathBuilder = geoPath(projection);

const COUNTRY_PATHS: string[] = (countries.features as Array<{
  geometry: GeoJSON.Geometry;
}>)
  .map((feat) => pathBuilder(feat.geometry) ?? "")
  .filter((d): d is string => d.length > 0);

const PROJECTED_OFFICES = OFFICES.map(({ name, coordinates }) => {
  const xy = projection(coordinates);
  return xy
    ? { name, x: xy[0], y: xy[1] }
    : null;
}).filter((o): o is { name: string; x: number; y: number } => o !== null);

// Equal Earth projection — preserves country sizes (no Mercator distortion);
// the same projection the NYT switched to in 2018. Pure server-rendered
// SVG: no client JS, no third-party requests, no API key.
export function WhereWeOperateMap({ ariaLabel }: { ariaLabel: string }) {
  return (
    <div className="relative w-full overflow-hidden">
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        style={{ width: "100%", height: "auto" }}
        role="img"
        aria-label={ariaLabel}
      >
        <g>
          {COUNTRY_PATHS.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="var(--color-muted)"
              stroke="none"
            />
          ))}
        </g>
        {PROJECTED_OFFICES.map(({ name, x, y }) => (
          <g key={name} transform={`translate(${x}, ${y})`}>
            <g className="dbc-map-marker">
              <circle r={11} fill="var(--color-primary)" opacity={0.25} />
              <circle r={5} fill="var(--color-primary)" />
              <text
                textAnchor="middle"
                y={22}
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: 12,
                  fontWeight: 700,
                  fill: "var(--color-foreground)",
                  paintOrder: "stroke",
                  stroke: "var(--color-bg)",
                  strokeWidth: 3,
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                }}
              >
                {name}
              </text>
            </g>
          </g>
        ))}
      </svg>
    </div>
  );
}
