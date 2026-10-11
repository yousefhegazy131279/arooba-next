import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "عُروبة — منصة القراءة والكتابة",
    short_name: "عُروبة",
    description: "روايات عربية، قارئ تفاعلي، مساحة كتابة، ومجتمع للقراء والكتّاب.",
    lang: "ar",
    dir: "rtl",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#050814",
    theme_color: "#050814",
    icons: [
      { src: "/app-icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/app-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
