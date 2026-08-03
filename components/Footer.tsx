import Image from "next/image";
import { Send, UsersRound } from "lucide-react";
import {
  FACEBOOK_URL,
  TELEGRAM_URL,
  VSEOSVITA_URL,
} from "@/lib/site";

const links = [
  { href: "/catalog/", label: "Каталог" },
  { href: "/free/", label: "Безкоштовні матеріали" },
  { href: "/rozrizaty-zobrazhennya/", label: "Розрізати зображення" },
  { href: "/about/", label: "Про автора" },
  { href: "/how-to-buy/", label: "Як придбати" },
  { href: "/contacts/", label: "Контакти" },
];

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-ribbon" aria-hidden="true" />
      <div className="site-container footer-grid">
        <div className="footer-brand">
          <Image
            src="/brand/logo.png"
            width={112}
            height={112}
            alt="Готово до уроку"
          />
          <div>
            <strong>Готово до уроку</strong>
            <p>
              Авторські навчальні матеріали для початкової школи — яскраві,
              зрозумілі й готові до використання.
            </p>
          </div>
        </div>
        <div>
          <h2>Швидкі посилання</h2>
          <ul>
            {links.map((item) => (
              <li key={item.href}>
                <a href={item.href}>{item.label}</a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2>Сторінки бренду</h2>
          <ul>
            <li>
              <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer">
                <Send size={17} aria-hidden="true" /> Telegram
              </a>
            </li>
            <li>
              <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer">
                <UsersRound size={17} aria-hidden="true" /> Facebook
              </a>
            </li>
            <li>
              <a href={VSEOSVITA_URL} target="_blank" rel="noopener noreferrer">
                Бібліотека «Всеосвіта»
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h2>Правова інформація</h2>
          <ul>
            <li>
              <a href="/privacy/">Політика конфіденційності</a>
            </li>
            <li>
              <a href="/terms/">Умови використання</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="site-container footer-bottom">
        © {new Date().getFullYear()} «Готово до уроку». Усі права захищені.
      </div>
    </footer>
  );
}
