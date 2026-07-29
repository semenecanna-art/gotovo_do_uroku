import Image from "next/image";
import { ArrowRight, Heart, Lightbulb, Timer } from "lucide-react";

export function AuthorSection() {
  return (
    <section className="author-section">
      <div className="author-image">
        <Image
          src="/brand/logo.png"
          width={1024}
          height={1024}
          alt="Персонаж бренду «Готово до уроку»"
          sizes="(max-width: 700px) 80vw, 38vw"
        />
      </div>
      <div className="author-copy">
        <span className="eyebrow">Про бренд</span>
        <h2>Ідеї, натхнення і готовий результат для вчителя</h2>
        <p>
          «Готово до уроку» — це авторські навчальні матеріали для початкової
          школи, створені так, щоб одночасно пояснювати тему, допомагати дитині
          та прикрашати навчальний простір.
        </p>
        <div className="author-values">
          <span>
            <Heart aria-hidden="true" /> З любов’ю до дітей
          </span>
          <span>
            <Lightbulb aria-hidden="true" /> Зрозуміло й цікаво
          </span>
          <span>
            <Timer aria-hidden="true" /> Економить час
          </span>
        </div>
        <a className="button button-secondary" href="/about/">
          Дізнатися більше про автора
          <ArrowRight size={19} aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
