import type { Metadata } from "next";
import {
  BookOpen,
  MessageCircle,
  Send,
  UsersRound,
} from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ContactForm } from "@/components/ContactForm";
import {
  FACEBOOK_URL,
  TELEGRAM_URL,
  VSEOSVITA_URL,
} from "@/lib/site";

export const metadata: Metadata = {
  title: "Контакти",
  description:
    "Зв’язатися з брендом «Готово до уроку», перейти в Telegram, Facebook або бібліотеку «Всеосвіта».",
  alternates: { canonical: "/contacts/" },
};

export default function ContactsPage() {
  return (
    <div className="inner-page">
      <div className="site-container narrow-page">
        <Breadcrumbs items={[{ label: "Контакти" }]} />
        <header className="simple-page-header">
          <span className="eyebrow">Напишіть нам</span>
          <h1>Контакти</h1>
          <p>
            Оберіть зручний спосіб зв’язку або залиште повідомлення через
            форму.
          </p>
        </header>
        <div className="contact-layout">
          <section className="contact-links" aria-label="Сторінки бренду">
            <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer">
              <span><Send aria-hidden="true" /></span>
              <div>
                <strong>Telegram</strong>
                <small>Нові матеріали й безкоштовні добірки</small>
              </div>
            </a>
            <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer">
              <span><UsersRound aria-hidden="true" /></span>
              <div>
                <strong>Facebook</strong>
                <small>Сторінка бренду та публікації</small>
              </div>
            </a>
            <a href={VSEOSVITA_URL} target="_blank" rel="noopener noreferrer">
              <span><BookOpen aria-hidden="true" /></span>
              <div>
                <strong>Всеосвіта</strong>
                <small>Повна бібліотека авторських матеріалів</small>
              </div>
            </a>
          </section>

          <section className="contact-form-card">
            <div className="form-heading">
              <span><MessageCircle aria-hidden="true" /></span>
              <div>
                <h2>Форма зворотного зв’язку</h2>
                <p>Заповніть усі обов’язкові поля.</p>
              </div>
            </div>
            <ContactForm />
          </section>
        </div>
      </div>
    </div>
  );
}
