"use client";

import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";
import worldData from "@/lib/world-110m.json";

// Three DBC offices, in the order shown on /about. Coordinates are
// [longitude, latitude] (Equal Earth projection convention).
const OFFICES = [
  { name: "Lubumbashi", coordinates: [27.4794, -11.6647] as [number, number] },
  { name: "Düsseldorf", coordinates: [6.7735, 51.2277] as [number, number] },
  { name: "Herblay-sur-Seine", coordinates: [2.1633, 49.0067] as [number, number] },
];

// Equal Earth projection — preserves country sizes (no Mercator distortion);
// the same projection the NYT switched to in 2018.
export function WhereWeOperateMap({
  ariaLabel,
}: {
  ariaLabel: string;
}) {
  return (
    <div className="relative w-full overflow-hidden">
      <ComposableMap
        projection="geoEqualEarth"
        projectionConfig={{ scale: 165 }}
        width={800}
        height={500}
        style={{ width: "100%", height: "auto" }}
        role="img"
        aria-label={ariaLabel}
      >
        <Geographies geography={worldData}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="var(--color-muted)"
                stroke="none"
                style={{
                  default: { outline: "none" },
                  hover: { outline: "none", fill: "var(--color-muted)" },
                  pressed: { outline: "none" },
                }}
              />
            ))
          }
        </Geographies>
        {OFFICES.map(({ name, coordinates }) => (
          <Marker key={name} coordinates={coordinates}>
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
          </Marker>
        ))}
      </ComposableMap>
    </div>
  );
}
