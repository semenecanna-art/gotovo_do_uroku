import type { MetadataRoute } from "next";
import { materials } from "@/lib/materials";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    "",
    "/catalog/",
    "/free/",
    "/rozrizaty-zobrazhennya/",
    "/about/",
    "/how-to-buy/",
    "/contacts/",
    "/privacy/",
    "/terms/",
  ];
  return [
    ...staticPages.map((path, index) => ({
      url: `${SITE_URL}${path}`,
      lastModified: new Date("2026-08-03"),
      changeFrequency: index < 3 ? ("weekly" as const) : ("monthly" as const),
      priority: index === 0 ? 1 : index < 3 ? 0.9 : 0.6,
    })),
    ...materials.map((material) => ({
      url: `${SITE_URL}/materials/${material.slug}/`,
      lastModified: material.createdAt
        ? new Date(material.createdAt)
        : new Date("2026-07-29"),
      changeFrequency: "monthly" as const,
      priority: material.isFeatured ? 0.8 : 0.6,
    })),
  ];
}
