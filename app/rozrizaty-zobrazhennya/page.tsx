import type { Metadata } from "next";
import Script from "next/script";
import { ImageSplitter } from "@/components/ImageSplitter";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Розрізати зображення на частини онлайн",
  description:
    "Безкоштовно розріж PNG, JPG або WEBP на частини й отримай готовий пакет для якісного друку: A4 PDF та PNG без втрати пікселів.",
  alternates: { canonical: "/rozrizaty-zobrazhennya/" },
  openGraph: {
    title: "Розрізати зображення на частини — Готово до уроку",
    description:
      "Безкоштовний онлайн-інструмент із перевіркою DPI, A4 PDF та PNG без втрати пікселів.",
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
      "Безкоштовний інструмент для розрізання зображень на сітку до 12 × 12, перевірки DPI та створення A4 PDF і PNG для друку.",
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
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js"
        integrity="sha512-z8IYLHO8bTgFqj+yrPyIJnzBDf7DDhWwiEsk4sY+Oe6J2M+WQequeGS7qioI5vT6rXgVRb4K1UVQC5ER7MKzKQ=="
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
            Завантаж картинку, обери кількість частин і отримай готовий пакет для
            друку: багатосторінковий A4 PDF та PNG без втрати пікселів.
          </p>
        </section>
        <div className="site-container splitter-content">
          <ImageSplitter />
        </div>
      </div>
    </>
  );
}
