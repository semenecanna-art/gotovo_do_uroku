import Image from "next/image";
import { ArrowRight, Check, Send, Sparkles } from "lucide-react";
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
            src="/brand/hero-banner.png"
            width={2048}
            height={848}
            alt="Готово до уроку — авторські матеріали для початкової школи"
            priority
            sizes="(max-width: 900px) 96vw, 54vw"
          />
          <div className="hero-materials" aria-label="Прев’ю матеріалів">
            {featured.slice(0, 3).map((material) => (
              <a
                key={material.id}
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
