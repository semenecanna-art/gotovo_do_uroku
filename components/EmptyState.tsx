import { SearchX } from "lucide-react";

export function EmptyState() {
  return (
    <div className="empty-state">
      <span>
        <SearchX size={34} aria-hidden="true" />
      </span>
      <h2>Матеріалів за цим запитом не знайдено</h2>
      <p>
        За цим запитом матеріалів поки немає. Спробуйте змінити слово або
        обрати іншу категорію.
      </p>
    </div>
  );
}
