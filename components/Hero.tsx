"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowRight, Check, Search, Send, Sparkles } from "lucide-react";
import { SafeImage } from "@/components/SafeImage";
import { TELEGRAM_URL } from "@/lib/site";
import type { MaterialSummary } from "@/lib/types";

export function Hero({
  total,
  featured,
}: {
  total: number;
  featured: MaterialSummary[];
}) {
  const [previewStart, setPreviewStart] = useState(0);
  const [previewPaused, setPreviewPaused] = useState(false);
  const previewCount = Math.min(3, featured.length);
  const visibleMaterials = Array.from({ length: previewCount }, (_, index) =>
    featured[(previewStart + index) % featured.length],
  );

  useEffect(() => {
    if (featured.length <= previewCount || previewPaused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setInterval(() => {
      setPreviewStart((current) => (current + 1) % featured.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [featured.length, previewCount, previewPaused]);

  return (
    <section className="hero-section">
      <span className="hero-dot hero-dot-one" aria-hidden="true" />
      <span className="hero-dot hero-dot-two" aria-hidden="true" />
      <div className="site-container hero-grid">
        <div className="hero-copy">
          <span className="hero-kicker">
            <Sparkles size={18} aria-hidden="true" />
            Авторські матеріали для початкової школи
          </span>
          <h1>Яскраві навчальні матеріали, з якими урок уже майже готовий</h1>
          <p>
            Готові презентації, картки, плакати, наочність та тематичні
            комплекти для вчителів початкових класів.
          </p>
          <form
            className="home-search"
            action="/catalog/"
            method="get"
            role="search"
          >
            <label htmlFor="home-material-search">
              Знайти матеріал за темою або класом
            </label>
            <div>
              <Search size={22} aria-hidden="true" />
              <input
                id="home-material-search"
                name="search"
                type="search"
                placeholder="Наприклад: 2 клас, математика, Росток"
                required
              />
              <button className="button button-primary" type="submit">
                Знайти
              </button>
            </div>
          </form>
          <div className="hero-actions">
            <a className="button button-primary" href="/catalog/">
              Переглянути матеріали
              <ArrowRight size={20} aria-hidden="true" />
            </a>
            <a
              className="button button-telegram"
              href={TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Send size={19} aria-hidden="true" />
              Безкоштовно в Telegram
            </a>
          </div>
          <div className="hero-note">
            <span>
              <Check size={16} aria-hidden="true" /> {total} матеріалів у
              каталозі
            </span>
            <span>
              <Check size={16} aria-hidden="true" /> Для 1–4 класів
            </span>
          </div>
        </div>
        <div className="hero-visual">
          <span className="sticker sticker-star" aria-hidden="true">
            ★
          </span>
          <span className="sticker sticker-heart" aria-hidden="true">
            ♥
          </span>
          <Image
            className="hero-banner-desktop"
            src="/brand/hero-banner.png"
            width={2048}
            height={848}
            alt="Готово до уроку — авторські матеріали для початкової школи"
            priority
            sizes="(max-width: 900px) 96vw, 54vw"
          />
          <Image
            className="hero-portrait-mobile"
            src="/brand/logo.png"
            width={1254}
            height={1254}
            alt="Авторка бренду «Готово до уроку»"
            priority
            sizes="(max-width: 700px) 68vw, 1px"
          />
          <div
            className="hero-materials"
            aria-label="Прев’ю найновіших матеріалів"
            onMouseEnter={() => setPreviewPaused(true)}
            onMouseLeave={() => setPreviewPaused(false)}
            onFocusCapture={() => setPreviewPaused(true)}
            onBlurCapture={() => setPreviewPaused(false)}
          >
            {visibleMaterials.map((material) => (
              <a
                key={`${previewStart}-${material.id}`}
                href={`/materials/${material.slug}/`}
                aria-label={`Відкрити «${material.title}»`}
              >
                <SafeImage
                  src={material.coverImage}
                  alt={material.imageAlt}
                  title={material.title}
                  grade={material.grade}
                  subject={material.subject}
                  width={360}
                  height={190}
                  priority
                />
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="hero-wave" aria-hidden="true" />
    </section>
  );
}
