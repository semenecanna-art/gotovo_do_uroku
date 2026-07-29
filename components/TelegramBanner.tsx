import Image from "next/image";
import { Send, Sparkles } from "lucide-react";
import { TELEGRAM_URL } from "@/lib/site";

export function TelegramBanner() {
  return (
    <section className="telegram-banner">
      <div className="telegram-glow" aria-hidden="true" />
      <Image
        src="/brand/logo.png"
        width={176}
        height={176}
        alt="Готово до уроку"
      />
      <div>
        <span>
          <Sparkles size={18} aria-hidden="true" /> Нові добірки регулярно
        </span>
        <h2>Ще більше безкоштовних матеріалів у Telegram</h2>
        <p>
          У каналі з’являються нові матеріали, ідеї для уроків, картки,
          шаблони та корисні добірки для вчителів початкової школи.
        </p>
      </div>
      <a
        className="button button-light"
        href={TELEGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Send size={20} aria-hidden="true" />
        Перейти в Telegram
      </a>
    </section>
  );
}
