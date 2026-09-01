import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CatalogClient } from "@/components/CatalogClient";
import { SectionHeading } from "@/components/SectionHeading";
import { TelegramBanner } from "@/components/TelegramBanner";
import { materialSummaries } from "@/lib/materials";

export const metadata: Metadata = {
  title: "Безкоштовні матеріали",
  description:
    "Безкоштовні авторські матеріали для початкової школи та нові добірки в Telegram-каналі «Готово до уроку».",
  alternates: { canonical: "/free/" },
};

export default function FreeMaterialsPage() {
  const freeCount = materialSummaries.filter((item) => item.isFree).length;
  return (
    <div className="inner-page">
      <div className="page-hero page-hero-free">
        <div className="site-container">
          <Breadcrumbs items={[{ label: "Безкоштовні матеріали" }]} />
          <SectionHeading
            eyebrow="Можна користуватися вже зараз"
            title="Безкоштовні матеріали"
            description={`У каталозі знайдено ${freeCount} безкоштовних матеріалів. Кнопка відкриє їхню публічну сторінку на «Всеосвіті».`}
          />
        </div>
      </div>
      <div className="site-container catalog-page-content">
        <CatalogClient items={materialSummaries} initialFreeOnly />
        <div className="section-space">
          <TelegramBanner />
        </div>
      </div>
    </div>
  );
}
