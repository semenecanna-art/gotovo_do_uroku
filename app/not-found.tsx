import { ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="status-page not-found-page site-container">
      <span className="error-code">404</span>
      <h1>Цю сторінку не знайдено</h1>
      <p>
        Можливо, адреса змінилася або в ній є помилка. Поверніться на головну
        чи знайдіть потрібний матеріал у каталозі.
      </p>
      <div className="status-actions">
        <a className="button button-secondary" href="/">
          <ArrowLeft size={19} aria-hidden="true" /> На головну
        </a>
        <a className="button button-primary" href="/catalog/">
          <Search size={19} aria-hidden="true" /> Відкрити каталог
        </a>
      </div>
    </div>
  );
}
