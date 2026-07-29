import type { Metadata } from "next";
import { ArrowRight, CheckCircle2, Send } from "lucide-react";
import { TELEGRAM_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Повідомлення надіслано",
  description: "Підтвердження надсилання форми зворотного зв’язку.",
  robots: { index: false, follow: true },
};

export default function SuccessPage() {
  return (
    <div className="status-page site-container">
      <span className="status-icon success">
        <CheckCircle2 size={54} aria-hidden="true" />
      </span>
      <h1>Повідомлення надіслано</h1>
      <p>
        Дякуємо! Форма успішно передана через Netlify Forms. Відповідь надійде
        на email, який ви вказали.
      </p>
      <div className="status-actions">
        <a className="button button-primary" href="/catalog/">
          До каталогу <ArrowRight size={19} aria-hidden="true" />
        </a>
        <a
          className="button button-telegram"
          href={TELEGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Send size={19} aria-hidden="true" /> Telegram
        </a>
      </div>
    </div>
  );
}
