import rawMaterials from "@/data/materials.json";
import telegramLinks from "@/data/telegram-links.json";
import type { Material, MaterialSummary } from "@/lib/types";

const directTelegramLinks = telegramLinks as Record<string, string>;

export const tidyMaterialText = (value: string) =>
  (value || "")
    .replace(/;(?=[\p{L}\p{N}«“„])/gu, "; ")
    .replace(/:(?=[\p{L}«“„])/gu, ": ")
    .replace(/\.(?=[А-ЯІЇЄҐA-Z])/gu, ". ")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

export const materials = (rawMaterials as Material[]).map((material) => ({
  ...material,
  shortDescription: tidyMaterialText(material.shortDescription),
  fullDescription: tidyMaterialText(material.fullDescription),
  telegramUrl: directTelegramLinks[material.slug] || material.telegramUrl || "",
}));

export const materialSummaries: MaterialSummary[] = materials.map(
  ({
    id,
    slug,
    title,
    shortDescription,
    category,
    subject,
    grade,
    materialType,
    fileFormat,
    pagesCount,
    coverImage,
    imageAlt,
    isFree,
    isFeatured,
    isNew,
    isPopular,
    vseosvitaUrl,
    telegramUrl,
    createdAt,
    price,
    views,
    previewStatus,
  }) => ({
    id,
    slug,
    title,
    shortDescription,
    category,
    subject,
    grade,
    materialType,
    fileFormat,
    pagesCount,
    coverImage,
    imageAlt,
    isFree,
    isFeatured,
    isNew,
    isPopular,
    vseosvitaUrl,
    telegramUrl,
    createdAt,
    price,
    views,
    previewStatus,
  }),
);

export const getMaterialBySlug = (slug: string) =>
  materials.find((material) => material.slug === slug);

export const getRelatedMaterials = (material: Material, limit = 4) =>
  materials
    .filter(
      (candidate) =>
        candidate.slug !== material.slug &&
        (candidate.category === material.category ||
          candidate.subject === material.subject ||
          candidate.grade === material.grade),
    )
    .sort((a, b) => {
      const aScore =
        Number(a.category === material.category) * 3 +
        Number(a.subject === material.subject) * 2 +
        Number(a.grade === material.grade);
      const bScore =
        Number(b.category === material.category) * 3 +
        Number(b.subject === material.subject) * 2 +
        Number(b.grade === material.grade);
      return bScore - aScore || b.views - a.views;
    })
    .slice(0, limit);

export const categories = Array.from(
  materials.reduce((acc, material) => {
    acc.set(material.category, (acc.get(material.category) ?? 0) + 1);
    return acc;
  }, new Map<string, number>()),
).map(([name, count]) => ({ name, count }));
