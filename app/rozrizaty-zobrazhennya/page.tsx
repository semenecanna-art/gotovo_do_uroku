import type { Metadata } from "next";
import Script from "next/script";
import { ImageSplitter } from "@/components/ImageSplitter";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Розрізати зображення на частини онлайн",
  description:
    "Безкоштовно розріж PNG, JPG або WEBP на частини онлайн. Обери сітку до 12 × 12 і завантаж усі фрагменти одним ZIP-архівом.",
  alternates: { canonical: "/rozrizaty-zobrazhennya/" },
  openGraph: {
    title: "Розрізати зображення на частини — Готово до уроку",
    description:
      "Безкоштовний онлайн-інструмент для плакатів, пазлів, ігор і навчальної наочності.",
    url: `${SITE_URL}/rozrizaty-zobrazhennya/`,
  },
};

export default function ImageSplitterPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Розрізати зображення — Готово до уроку",
    url: `${SITE_URL}/rozrizaty-zobrazhennya/`,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Будь-яка система із сучасним браузером",
    inLanguage: "uk",
    offers: { "@type": "Offer", price: "0", priceCurrency: "UAH" },
    description:
      "Безкоштовний інструмент для розрізання зображень на сітку до 12 × 12 із завантаженням ZIP-архіву.",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"
        integrity="sha512-XMVd28F1oH/O71fzwBnV7HucLxVwtxf26XV8P4wPk26EDxuGZ91N8bsOttmnomcCD3CS5ZMRL50H0GgOHvegtg=="
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
        strategy="afterInteractive"
      />
      <div className="splitter-page">
        <section className="site-container splitter-hero">
          <span className="splitter-eyebrow">Безкоштовний онлайн-сервіс</span>
          <h1>
            Розріж зображення <span>на потрібні частини</span>
          </h1>
          <p>
            Завантаж картинку, обери кількість частин по ширині й висоті та отримай
            всі фрагменти одним ZIP-архівом.
          </p>
        </section>
        <div className="site-container splitter-content">
          <ImageSplitter />
        </div>
      </div>
    </>
  );
}
