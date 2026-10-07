import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mezzani",
    short_name: "Mezzani",
    description: "QR ordering and restaurant management",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#F6F2E9",
    theme_color: "#1E2529",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  }
}
