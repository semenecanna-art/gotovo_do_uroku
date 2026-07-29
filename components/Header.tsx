"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, Send, X } from "lucide-react";
import { useEffect, useState } from "react";
import { TELEGRAM_URL } from "@/lib/site";

const navigation = [
  { href: "/", label: "Головна" },
  { href: "/catalog/", label: "Каталог" },
  { href: "/free/", label: "Безкоштовні матеріали" },
  { href: "/about/", label: "Про автора" },
  { href: "/how-to-buy/", label: "Як придбати" },
  { href: "/contacts/", label: "Контакти" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="site-header">
      <div className="site-container header-inner">
        <a href="/" className="brand-link" aria-label="Готово до уроку — головна">
          <Image
            src="/brand/logo.png"
            width={72}
            height={72}
            alt="Логотип «Готово до уроку»"
            priority
          />
          <span>
            <strong>Готово до уроку</strong>
            <small>Авторські матеріали для вчителя</small>
          </span>
        </a>

        <nav className="desktop-nav" aria-label="Основна навігація">
          {navigation.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={pathname === item.href ? "active" : ""}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <a
          className="button button-telegram header-telegram"
          href={TELEGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Send size={18} aria-hidden="true" />
          Telegram
        </a>

        <button
          className="menu-toggle"
          type="button"
          aria-label={open ? "Закрити меню" : "Відкрити меню"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </div>

      {open && (
        <div className="mobile-menu-layer">
          <button
            className="mobile-menu-backdrop"
            aria-label="Закрити меню"
            onClick={() => setOpen(false)}
          />
          <nav className="mobile-menu" aria-label="Мобільна навігація">
            <div className="mobile-brand">
              <Image
                src="/brand/logo.png"
                width={84}
                height={84}
                alt="Логотип «Готово до уроку»"
              />
              <strong>Готово до уроку</strong>
            </div>
            {navigation.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={pathname === item.href ? "active" : ""}
              >
                {item.label}
              </a>
            ))}
            <a
              className="button button-telegram"
              href={TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Send size={19} aria-hidden="true" />
              Перейти в Telegram
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
