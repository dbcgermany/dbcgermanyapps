import type { MetadataRoute } from "next";
import { BRAND_HEX } from "@dbc/ui";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DBC Germany",
    short_name: "DBC Germany",
    description:
      "DBC Germany — African-rooted business community in Europe. Richesses d'Afrique conferences, masterclasses, and diaspora events.",
    start_url: "/",
    display: "standalone",
    background_color: BRAND_HEX.paper,
    theme_color: BRAND_HEX.red,
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
