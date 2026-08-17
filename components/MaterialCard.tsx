import { ArrowUpRight, BookOpen, Gift, Send, ShoppingBag } from "lucide-react";
import { SafeImage } from "@/components/SafeImage";
import type { MaterialSummary } from "@/lib/types";

export function MaterialCard({ material }: { material: MaterialSummary }) {
  return (
    <article className="material-card">
      <a
        href={`/materials/${material.slug}/`}
        className="material-image-link"
        aria-label={`Переглянути матеріал «${material.title}»`}
      >
        <SafeImage
          src={material.coverImage}
          alt={material.imageAlt}
          title={material.title}
          grade={material.grade}
          subject={material.subject}
          width={1200}
          height={630}
          wrapperClassName="material-card-image"
        />
        <span className={`material-status ${material.isFree ? "free" : "paid"}`}>
          {material.isFree ? (
            <>
              <Gift size={15} aria-hidden="true" /> Безкоштовно
            </>
          ) : (
            <>
              <ShoppingBag size={15} aria-hidden="true" /> На Всеосвіті
            </>
          )}
        </span>
      </a>
      <div className="material-card-body">
        <div className="material-tags" aria-label="Характеристики матеріалу">
          {material.grade && <span className="tag tag-pink">{material.grade}</span>}
          {material.subject && (
            <span className="tag tag-blue">{material.subject}</span>
          )}
          {material.fileFormat && (
            <span className="tag tag-yellow">{material.fileFormat}</span>
          )}
        </div>
        <h3>
          <a href={`/materials/${material.slug}/`}>{material.title}</a>
        </h3>
        <p>{material.shortDescription}</p>
        <div className="material-meta">
          {material.materialType && (
            <span>
              <BookOpen size={16} aria-hidden="true" />
              {material.materialType}
            </span>
          )}
          {material.pagesCount && (
            <span>{material.pagesCount} стор./слайдів</span>
          )}
        </div>
        <div className="material-actions">
          <a className="button button-small button-secondary" href={`/materials/${material.slug}/`}>
            Переглянути
          </a>
          <div className="material-external-actions">
            {material.vseosvitaUrl && (
              <a
                className="text-action"
                href={material.vseosvitaUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${material.isFree ? "Відкрити" : "Купити"} «${material.title}» на Всеосвіті`}
              >
                Всеосвіта
                <ArrowUpRight size={17} aria-hidden="true" />
              </a>
            )}
            {material.telegramUrl && (
              <a
                className="text-action card-telegram-action"
                href={material.telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Відкрити «${material.title}» у Telegram`}
              >
                <Send size={16} aria-hidden="true" />
                Telegram
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
