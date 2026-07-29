import {
  BookHeart,
  BookOpenText,
  Boxes,
  Calculator,
  Dices,
  Earth,
  GalleryVerticalEnd,
  Languages,
  Palette,
  Presentation,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const icons: Record<string, LucideIcon> = {
  "Українська мова": Languages,
  Читання: BookOpenText,
  Математика: Calculator,
  "Я досліджую світ": Earth,
  "Оформлення класу": Palette,
  "Картки та ігри": Dices,
  Наочність: GalleryVerticalEnd,
  Презентації: Presentation,
  "Перший урок": BookHeart,
  "Тематичні комплекти": Boxes,
};

export function CategoryCard({
  name,
  count,
  index,
}: {
  name: string;
  count: number;
  index: number;
}) {
  const Icon = icons[name] ?? BookOpenText;
  return (
    <a
      className={`category-card category-tone-${(index % 5) + 1}`}
      href={`/catalog/?category=${encodeURIComponent(name)}`}
    >
      <span className="category-icon">
        <Icon size={30} strokeWidth={2.2} aria-hidden="true" />
      </span>
      <span>
        <strong>{name}</strong>
        <small>{count} матеріалів</small>
      </span>
    </a>
  );
}
