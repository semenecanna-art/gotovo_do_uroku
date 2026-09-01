import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Готово до уроку",
    short_name: "Готово до уроку",
    description: "Авторські матеріали для початкової школи",
    start_url: "/",
    display: "standalone",
    background_color: "#fff9f2",
    theme_color: "#f72e88",
    lang: "uk",
    icons: [
      {
        src: "/brand/logo.png",
        sizes: "1024x1024",
        type: "image/png",
      },
    ],
  };
}
