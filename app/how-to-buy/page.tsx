import type { Metadata } from "next";
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  MousePointerClick,
  Search,
  ShieldCheck,
} from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "Як придбати матеріал",
  description:
    "Просте пояснення, як знайти матеріал на сайті та придбати його через платформу «Всеосвіта».",
  alternates: { canonical: "/how-to-buy/" },
};

const steps = [
  {
    title: "Оберіть матеріал",
    text: "Скористайтеся каталогом, пошуком або фільтрами за класом і предметом.",
    icon: Search,
  },
  {
    title: "Натисніть «Купити на Всеосвіті»",
    text: "Кнопка веде на конкретну публічну сторінку обраного матеріалу.",
    icon: MousePointerClick,
  },
  {
    title: "Перейдіть на платформу",
    text: "Сторінка «Всеосвіти» відкриється в новій вкладці браузера.",
    icon: ExternalLink,
  },
  {
    title: "Придбайте та завантажте",
    text: "Оплата й отримання файла відбуваються за правилами платформи «Всеосвіта».",
    icon: CheckCircle2,
  },
];

export default function HowToBuyPage() {
  return (
    <div className="inner-page">
      <div className="site-container narrow-page">
        <Breadcrumbs items={[{ label: "Як придбати" }]} />
        <header className="simple-page-header">
          <span className="eyebrow">Чотири прості кроки</span>
          <h1>Як придбати матеріал</h1>
          <p>
            Сайт «Готово до уроку» допомагає знайти потрібний матеріал, а
            придбання відбувається на платформі «Всеосвіта».
          </p>
        </header>
        <section className="steps-grid">
          {steps.map(({ title, text, icon: Icon }, index) => (
            <article key={title}>
              <span className="step-number">{index + 1}</span>
              <span className="step-icon">
                <Icon size={29} aria-hidden="true" />
              </span>
              <h2>{title}</h2>
              <p>{text}</p>
            </article>
          ))}
        </section>
        <section className="payment-note">
          <ShieldCheck size={36} aria-hidden="true" />
          <div>
            <h2>Оплата проходить не на цьому сайті</h2>
            <p>
              Оплата та завантаження платних матеріалів відбуваються на
              платформі “Всеосвіта”. Сайт “Готово до уроку” не приймає оплату
              та не зберігає платіжні дані.
            </p>
          </div>
        </section>
        <div className="center-action">
          <a className="button button-primary" href="/catalog/">
            Перейти до каталогу <ArrowRight size={19} aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>
  );
}
