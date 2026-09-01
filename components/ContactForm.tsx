"use client";

import { Send } from "lucide-react";
import { useState, type FormEvent } from "react";

export function ContactForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError("");

    const body = new URLSearchParams();
    for (const [key, value] of new FormData(event.currentTarget)) {
      body.append(key, String(value));
    }

    try {
      const response = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      window.location.assign("/success/");
    } catch {
      setError(
        "Повідомлення не вдалося надіслати. Спробуйте ще раз або напишіть у Telegram.",
      );
      setPending(false);
    }
  };

  return (
    <form
      name="contact"
      method="POST"
      action="/success/"
      data-netlify="true"
      netlify-honeypot="bot-field"
      onSubmit={handleSubmit}
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
          Погоджуюся з обробкою даних для відповіді на моє повідомлення згідно з
          політикою конфіденційності.
        </span>
      </label>
      {error && (
        <p className="form-error" role="alert" aria-live="polite">
          {error}
        </p>
      )}
      <button className="button button-primary" type="submit" disabled={pending}>
        <Send size={19} aria-hidden="true" />
        {pending ? "Надсилаємо…" : "Надіслати повідомлення"}
      </button>
    </form>
  );
}
