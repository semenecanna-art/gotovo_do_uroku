import type { Metadata } from "next";
import Image from "next/image";
import { Heart, Lightbulb, Palette, Send, Timer } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { TELEGRAM_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Про автора і бренд",
  description:
    "Про бренд «Готово до уроку», принципи створення матеріалів і користь для вчителів початкової школи.",
  alternates: { canonical: "/about/" },
};

export default function AboutPage() {
  return (
    <div className="inner-page">
      <div className="site-container narrow-page">
        <Breadcrumbs items={[{ label: "Про автора" }]} />
        <section className="about-hero">
          <div className="about-portrait">
            <Image
              src="/brand/logo.png"
              width={1024}
              height={1024}
              alt="Персонаж бренду «Готово до уроку»"
              priority
            />
          </div>
          <div>
            <span className="eyebrow">Знайомство</span>
            <h1>Матеріали, створені з повагою до часу вчителя</h1>
            <p>
              «Готово до уроку» — авторський бренд навчальних матеріалів для
              початкової школи. Тут зібрані презентації, картки, робочі аркуші,
              плакати, наочність і тематичні комплекти.
            </p>
            <p>
              В основі роботи — проста мета: дати вчителю охайний, зрозумілий і
              готовий результат, а дитині — цікаву візуальну опору для
              навчання.
            </p>
          </div>
        </section>

        <section className="about-values section-space">
          <h2>Принципи «Готово до уроку»</h2>
          <div className="value-grid">
            <article>
              <span><Heart aria-hidden="true" /></span>
              <h3>З любов’ю до дітей</h3>
              <p>Завдання й оформлення мають підтримувати, зацікавлювати та не перевантажувати.</p>
            </article>
            <article>
              <span><Lightbulb aria-hidden="true" /></span>
              <h3>Зрозуміла подача</h3>
              <p>Складні теми пояснюються через послідовні кроки, образи й наочні опори.</p>
            </article>
            <article>
              <span><Palette aria-hidden="true" /></span>
              <h3>Авторський стиль</h3>
              <p>Яскраве оформлення поєднується з чистою структурою та читабельністю.</p>
            </article>
            <article>
              <span><Timer aria-hidden="true" /></span>
              <h3>Економія часу</h3>
              <p>Матеріали створюються для практичного використання без довгої додаткової підготовки.</p>
            </article>
          </div>
        </section>

        <section className="about-invite">
          <div>
            <span className="eyebrow">Будьмо на зв’язку</span>
            <h2>Нові матеріали й учительські ідеї — у Telegram</h2>
            <p>
              Приєднуйтеся до каналу, щоб бачити нові добірки, безкоштовні
              матеріали й оновлення каталогу.
            </p>
          </div>
          <a
            className="button button-telegram"
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Send size={20} aria-hidden="true" /> Приєднатися
          </a>
        </section>
      </div>
    </div>
  );
}
