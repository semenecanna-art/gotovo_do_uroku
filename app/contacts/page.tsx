import type { Metadata } from "next";
import {
  BookOpen,
  MessageCircle,
  Send,
  UsersRound,
} from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
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
            <form
              name="contact"
              method="POST"
              action="/success/"
              data-netlify="true"
              netlify-honeypot="bot-field"
            >
              <input type="hidden" name="form-name" value="contact" />
              <p className="honeypot">
                <label>
                  Не заповнюйте це поле:
                  <input name="bot-field" tabIndex={-1} autoComplete="off" />
                </label>
              </p>
              <div className="form-grid">
                <label>
                  <span>Ім’я *</span>
                  <input
                    type="text"
                    name="name"
                    required
                    minLength={2}
                    maxLength={80}
                    autoComplete="name"
                  />
                </label>
                <label>
                  <span>Email *</span>
                  <input
                    type="email"
                    name="email"
                    required
                    maxLength={120}
                    autoComplete="email"
                  />
                </label>
              </div>
              <label>
                <span>Тема *</span>
                <input type="text" name="subject" required minLength={3} maxLength={140} />
              </label>
              <label>
                <span>Повідомлення *</span>
                <textarea name="message" required minLength={10} maxLength={3000} rows={7} />
              </label>
              <label className="privacy-check">
                <input type="checkbox" name="privacy-consent" value="yes" required />
                <span>
                  Погоджуюся з обробкою даних для відповіді на моє
                  повідомлення згідно з політикою конфіденційності.
                </span>
              </label>
              <button className="button button-primary" type="submit">
                <Send size={19} aria-hidden="true" /> Надіслати повідомлення
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
