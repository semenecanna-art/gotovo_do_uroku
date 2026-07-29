import Image from "next/image";

type BrandFallbackProps = {
  title: string;
  grade?: string;
  subject?: string;
  className?: string;
};

export function BrandFallback({
  title,
  grade,
  subject,
  className = "",
}: BrandFallbackProps) {
  return (
    <div className={`brand-fallback ${className}`} role="img" aria-label={title}>
      <span className="fallback-orb fallback-orb-one" aria-hidden="true" />
      <span className="fallback-orb fallback-orb-two" aria-hidden="true" />
      <Image
        src="/brand/logo.png"
        width={96}
        height={96}
        alt=""
        className="fallback-logo"
      />
      <div className="fallback-copy">
        <p className="fallback-kicker">Готово до уроку</p>
        <strong>{title}</strong>
        {(grade || subject) && (
          <span>{[grade, subject].filter(Boolean).join(" · ")}</span>
        )}
      </div>
      <small>gotovo_do_uroku</small>
    </div>
  );
}
