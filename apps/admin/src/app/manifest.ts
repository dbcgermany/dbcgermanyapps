import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DBC Germany Admin",
    short_name: "DBC Admin",
    description: "Admin dashboard for DBC Germany event management.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#b81838",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
