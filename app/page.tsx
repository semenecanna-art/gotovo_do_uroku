import type { Metadata } from "next";
import {
  BookOpenCheck,
  Clock3,
  GraduationCap,
  PrinterCheck,
} from "lucide-react";
import { AuthorSection } from "@/components/AuthorSection";
import { CategoryCard } from "@/components/CategoryCard";
import { Hero } from "@/components/Hero";
import { MaterialCard } from "@/components/MaterialCard";
import { SectionHeading } from "@/components/SectionHeading";
import { TelegramBanner } from "@/components/TelegramBanner";
import {
  categories,
  materials,
  materialSummaries,
} from "@/lib/materials";
import { SITE_URL, siteDescription } from "@/lib/site";

export const metadata: Metadata = {
  title: "Авторські матеріали для початкової школи",
  description: siteDescription,
  alternates: { canonical: "/" },
};

const mainCategories = [
  "Українська мова",
  "Читання",
  "Математика",
  "Я досліджую світ",
  "Оформлення класу",
  "Картки та ігри",
  "Наочність",
  "Презентації",
  "Перший урок",
  "Тематичні комплекти",
];

const benefits = [
  {
    title: "Готово до друку",
    description:
      "Матеріали можна відкрити й одразу підготувати до роботи на уроці.",
    icon: PrinterCheck,
  },
  {
    title: "Для 1–4 класів",
    description:
      "Зручний пошук за класом, предметом і типом допомагає швидко знайти потрібне.",
    icon: GraduationCap,
  },
  {
    title: "Яскраво та зрозуміло дітям",
    description:
      "Візуальна подача підтримує увагу й допомагає пояснювати складне простими словами.",
    icon: BookOpenCheck,
  },
  {
    title: "Економить час учителя",
    description:
      "Готові презентації, картки й комплекти зменшують час підготовки до уроку.",
    icon: Clock3,
  },
];

export default function HomePage() {
  const markedFeatured = materialSummaries
    .filter((material) => material.isFeatured)
    .slice(0, 8);
  const featured = markedFeatured.length
    ? markedFeatured
    : materialSummaries.slice(0, 8);
  const categoryCounts = new Map(
    categories.map((category) => [category.name, category.count]),
  );
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Готово до уроку",
    url: SITE_URL,
    description: siteDescription,
    inLanguage: "uk",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/catalog/?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero total={materials.length} featured={featured.slice(0, 3)} />

      <section className="site-container benefits-grid section-overlap">
        {benefits.map(({ title, description, icon: Icon }, index) => (
          <article className={`benefit-card benefit-${index + 1}`} key={title}>
            <span>
              <Icon size={30} strokeWidth={2.2} aria-hidden="true" />
            </span>
            <div>
              <h2>{title}</h2>
              <p>{description}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="site-container section-space">
        <SectionHeading
          eyebrow="Добірка вчителів"
          title="Популярні матеріали"
          description="Матеріали з найбільшою кількістю публічних переглядів і завантажень у бібліотеці авторки."
        />
        <div className="material-grid home-materials">
          {featured.map((material) => (
            <MaterialCard key={material.id} material={material} />
          ))}
        </div>
        <div className="center-action">
          <a className="button button-primary" href="/catalog/">
            Відкрити весь каталог
          </a>
        </div>
      </section>

      <section className="categories-section section-space">
        <div className="site-container">
          <SectionHeading
            eyebrow="Швидкий вибір"
            title="Знайди матеріал за категорією"
            description="Оберіть напрям — каталог одразу покаже відповідну добірку."
          />
          <div className="category-grid">
            {mainCategories.map((name, index) => (
              <CategoryCard
                key={name}
                name={name}
                count={categoryCounts.get(name) ?? 0}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="site-container section-space">
        <TelegramBanner />
      </section>

      <section className="site-container section-space">
        <AuthorSection />
      </section>
    </>
  );
}
