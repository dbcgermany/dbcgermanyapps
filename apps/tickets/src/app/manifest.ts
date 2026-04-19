import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DBC Germany Tickets",
    short_name: "DBC Tickets",
    description:
      "Buy tickets for Richesses d'Afrique conferences and masterclasses by DBC Germany.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#b81838",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
