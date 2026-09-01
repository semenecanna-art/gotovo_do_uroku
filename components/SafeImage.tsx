"use client";

import { useState } from "react";
import { BrandFallback } from "@/components/BrandFallback";

type SafeImageProps = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  wrapperClassName?: string;
  priority?: boolean;
  title?: string;
  grade?: string;
  subject?: string;
  onClick?: () => void;
};

export function SafeImage({
  src,
  alt,
  width = 1200,
  height = 630,
  className = "",
  wrapperClassName = "",
  priority = false,
  title = alt,
  grade,
  subject,
  onClick,
}: SafeImageProps) {
  const [failed, setFailed] = useState(!src);

  return (
    <div className={`safe-image ${wrapperClassName}`}>
      {failed ? (
        <BrandFallback title={title} grade={grade} subject={subject} />
      ) : (
        // Звичайний img потрібен для поєднання локальних і публічних gallery URL.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          className={className}
          onError={() => setFailed(true)}
          onClick={onClick}
        />
      )}
    </div>
  );
}
