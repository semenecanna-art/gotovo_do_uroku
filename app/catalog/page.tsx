import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CatalogClient } from "@/components/CatalogClient";
import { SectionHeading } from "@/components/SectionHeading";
import { materialSummaries } from "@/lib/materials";

export const metadata: Metadata = {
  title: "Каталог навчальних матеріалів",
  description:
    "Каталог авторських матеріалів для 1–4 класів: пошук, фільтри за класом, предметом, типом і форматом.",
  alternates: { canonical: "/catalog/" },
};

export default function CatalogPage() {
  return (
    <div className="inner-page">
      <div className="page-hero page-hero-catalog">
        <div className="site-container">
          <Breadcrumbs items={[{ label: "Каталог" }]} />
          <SectionHeading
            eyebrow="Усі матеріали"
            title="Каталог «Готово до уроку»"
            description={`${materialSummaries.length} авторських матеріалів із реальними прев’ю. Знайдіть потрібне за назвою, класом, предметом або типом.`}
          />
        </div>
      </div>
      <div className="site-container catalog-page-content">
        <CatalogClient items={materialSummaries} />
      </div>
    </div>
  );
}
