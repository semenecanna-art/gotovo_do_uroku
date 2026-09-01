import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  FileText,
  Gift,
  GraduationCap,
  Layers3,
  Send,
  ShoppingBag,
  Tag,
} from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { MaterialGallery } from "@/components/MaterialGallery";
import { RelatedMaterials } from "@/components/RelatedMaterials";
import { ShareButton } from "@/components/ShareButton";
import {
  getMaterialBySlug,
  getRelatedMaterials,
  materials,
} from "@/lib/materials";
import { SITE_URL } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return materials.map((material) => ({ slug: material.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const material = getMaterialBySlug(slug);
  if (!material) return {};
  return {
    title: material.title,
    description: material.shortDescription,
    alternates: { canonical: `/materials/${material.slug}/` },
    openGraph: {
      type: "article",
      locale: "uk_UA",
      title: material.title,
      description: material.shortDescription,
      url: `${SITE_URL}/materials/${material.slug}/`,
      publishedTime: material.createdAt || undefined,
      images: [
        {
          url: material.ogImage || "/brand/hero-banner.png",
          alt: material.imageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: material.title,
      description: material.shortDescription,
      images: [material.ogImage || "/brand/hero-banner.png"],
    },
  };
}

const formatDate = (value: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("uk-UA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};

export default async function MaterialPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const material = getMaterialBySlug(slug);
  if (!material) notFound();

  const related = getRelatedMaterials(material);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: material.title,
    description: material.shortDescription,
    url: `${SITE_URL}/materials/${material.slug}/`,
    image: material.ogImage,
    author: { "@type": "Organization", name: "Готово до уроку" },
    inLanguage: "uk",
    educationalLevel: material.grade || undefined,
    learningResourceType: material.materialType || undefined,
    isAccessibleForFree: material.isFree,
    datePublished: material.createdAt || undefined,
    sameAs: [material.vseosvitaUrl, material.telegramUrl].filter(Boolean),
  };

  return (
    <div className="inner-page material-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="site-container">
        <Breadcrumbs
          items={[
            { label: "Каталог", href: "/catalog/" },
            { label: material.category, href: `/catalog/?category=${encodeURIComponent(material.category)}` },
            { label: material.title },
          ]}
        />
        <a className="back-link" href="/catalog/">
          <ArrowLeft size={18} aria-hidden="true" /> Повернутися до каталогу
        </a>

        <article className="material-detail">
          <div className="material-detail-gallery">
            <MaterialGallery
              images={material.images.length ? material.images : [material.coverImage]}
              title={material.title}
              grade={material.grade}
              subject={material.subject}
            />
          </div>
          <div className="material-detail-copy">
            <div className="detail-labels">
              <span className={material.isFree ? "free" : "paid"}>
                {material.isFree ? (
                  <><Gift size={16} aria-hidden="true" /> Безкоштовно</>
                ) : (
                  <><ShoppingBag size={16} aria-hidden="true" /> На Всеосвіті</>
                )}
              </span>
              {material.isNew && <span className="new">Новинка</span>}
            </div>
            <h1>{material.title}</h1>
            <p className="detail-lead">{material.shortDescription}</p>
            <dl className="material-facts">
              {material.grade && (
                <div>
                  <dt><GraduationCap aria-hidden="true" /> Клас</dt>
                  <dd>{material.grade}</dd>
                </div>
              )}
              {material.subject && (
                <div>
                  <dt><BookOpen aria-hidden="true" /> Предмет</dt>
                  <dd>{material.subject}</dd>
                </div>
              )}
              {material.materialType && (
                <div>
                  <dt><Layers3 aria-hidden="true" /> Тип</dt>
                  <dd>{material.materialType}</dd>
                </div>
              )}
              {material.fileFormat && (
                <div>
                  <dt><FileText aria-hidden="true" /> Формат</dt>
                  <dd>{material.fileFormat}</dd>
                </div>
              )}
              {material.pagesCount && (
                <div>
                  <dt><Tag aria-hidden="true" /> Обсяг</dt>
                  <dd>{material.pagesCount} стор./слайдів</dd>
                </div>
              )}
              {formatDate(material.createdAt) && (
                <div>
                  <dt><CalendarDays aria-hidden="true" /> Опубліковано</dt>
                  <dd>{formatDate(material.createdAt)}</dd>
                </div>
              )}
            </dl>
            <div className="detail-actions">
              {material.vseosvitaUrl && (
                <a
                  className="button button-buy"
                  href={material.vseosvitaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {material.isFree ? "Відкрити на Всеосвіті" : "Купити на Всеосвіті"}
                  <ArrowUpRight size={20} aria-hidden="true" />
                </a>
              )}
              {material.telegramUrl && (
                <a
                  className="button button-telegram"
                  href={material.telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Send size={19} aria-hidden="true" />
                  Відкрити матеріал у Telegram
                </a>
              )}
              <ShareButton title={material.title} />
            </div>
            <p className="external-note">
              {material.vseosvitaUrl &&
                "Оплата й завантаження на Всеосвіті відбуваються за правилами платформи. "}
              {material.telegramUrl &&
                "Telegram-кнопка відкриває прямий допис із файлом матеріалу."}
            </p>
          </div>
        </article>

        <section className="material-description">
          <div className="description-main">
            <span className="eyebrow">Про матеріал</span>
            <h2>Опис</h2>
            {material.fullDescription
              .split(/\n{2,}/)
              .filter(Boolean)
              .map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          </div>
          <aside className="description-aside">
            <h2>Що підтверджено</h2>
            <ul>
              {material.fileFormat && <li>Формат: {material.fileFormat}</li>}
              {material.pagesCount && (
                <li>Обсяг: {material.pagesCount} сторінок або слайдів</li>
              )}
              {material.grade && <li>Для класу: {material.grade}</li>}
              {material.subject && <li>Предмет: {material.subject}</li>}
            </ul>
            <p>
              Повний склад комплекту, умови доступу та спосіб використання
              вказані авторкою на сторінці матеріалу.
            </p>
            <div className="description-aside-links">
              {material.vseosvitaUrl && (
                <a
                  className="text-action"
                  href={material.vseosvitaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Переглянути на Всеосвіті
                  <ArrowUpRight size={17} aria-hidden="true" />
                </a>
              )}
              {material.telegramUrl && (
                <a
                  className="text-action card-telegram-action"
                  href={material.telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Send size={17} aria-hidden="true" />
                  Відкрити матеріал у Telegram
                </a>
              )}
            </div>
          </aside>
        </section>

        <RelatedMaterials items={related} />
      </div>
    </div>
  );
}
