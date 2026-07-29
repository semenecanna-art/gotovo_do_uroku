"use client";

import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { SafeImage } from "@/components/SafeImage";

export function MaterialGallery({
  images,
  title,
  grade,
  subject,
}: {
  images: string[];
  title: string;
  grade?: string;
  subject?: string;
}) {
  const uniqueImages = Array.from(new Set(images.filter(Boolean)));
  const [active, setActive] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  const previous = useCallback(
    () =>
      setActive((index) =>
        index === 0 ? uniqueImages.length - 1 : index - 1,
      ),
    [uniqueImages.length],
  );
  const next = useCallback(
    () =>
      setActive((index) =>
        index === uniqueImages.length - 1 ? 0 : index + 1,
      ),
    [uniqueImages.length],
  );

  useEffect(() => {
    if (!modalOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setModalOpen(false);
      if (event.key === "ArrowLeft" && uniqueImages.length > 1) previous();
      if (event.key === "ArrowRight" && uniqueImages.length > 1) next();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [modalOpen, next, previous, uniqueImages.length]);

  const image = uniqueImages[active] ?? "";
  const alt = `${title} — прев’ю ${active + 1}`;

  return (
    <div className="material-gallery">
      <div className="gallery-main">
        <button
          type="button"
          className="gallery-image-button"
          onClick={() => setModalOpen(true)}
          aria-label="Збільшити зображення"
        >
          <SafeImage
            src={image}
            alt={alt}
            title={title}
            grade={grade}
            subject={subject}
            priority
            wrapperClassName="gallery-main-image"
          />
          <span className="zoom-hint">
            <Maximize2 size={18} aria-hidden="true" />
            Збільшити
          </span>
        </button>
        {uniqueImages.length > 1 && (
          <>
            <button
              type="button"
              className="gallery-arrow previous"
              onClick={previous}
              aria-label="Попереднє зображення"
            >
              <ChevronLeft aria-hidden="true" />
            </button>
            <button
              type="button"
              className="gallery-arrow next"
              onClick={next}
              aria-label="Наступне зображення"
            >
              <ChevronRight aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      {uniqueImages.length > 1 && (
        <div className="gallery-thumbnails" aria-label="Мініатюри">
          {uniqueImages.map((src, index) => (
            <button
              type="button"
              key={src}
              className={index === active ? "active" : ""}
              onClick={() => setActive(index)}
              aria-label={`Показати прев’ю ${index + 1}`}
              aria-pressed={index === active}
            >
              <SafeImage
                src={src}
                alt=""
                title={title}
                width={180}
                height={120}
              />
            </button>
          ))}
        </div>
      )}

      {modalOpen && (
        <div
          className="gallery-modal"
          role="dialog"
          aria-modal="true"
          aria-label={`Збільшене прев’ю матеріалу «${title}»`}
        >
          <button
            type="button"
            className="gallery-modal-backdrop"
            aria-label="Закрити збільшене зображення"
            onClick={() => setModalOpen(false)}
          />
          <button
            type="button"
            className="gallery-modal-close"
            onClick={() => setModalOpen(false)}
            aria-label="Закрити"
            autoFocus
          >
            <X aria-hidden="true" />
          </button>
          <SafeImage
            src={image}
            alt={alt}
            title={title}
            grade={grade}
            subject={subject}
            wrapperClassName="gallery-modal-image"
          />
          {uniqueImages.length > 1 && (
            <>
              <button
                type="button"
                className="gallery-modal-arrow previous"
                onClick={previous}
                aria-label="Попереднє зображення"
              >
                <ChevronLeft aria-hidden="true" />
              </button>
              <button
                type="button"
                className="gallery-modal-arrow next"
                onClick={next}
                aria-label="Наступне зображення"
              >
                <ChevronRight aria-hidden="true" />
              </button>
              <span className="gallery-count">
                {active + 1} / {uniqueImages.length}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
