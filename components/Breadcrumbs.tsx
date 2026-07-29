import { ChevronRight, Home } from "lucide-react";

type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="breadcrumbs" aria-label="Хлібні крихти">
      <ol>
        <li>
          <a href="/" aria-label="Головна">
            <Home size={16} aria-hidden="true" />
          </a>
        </li>
        {items.map((item) => (
          <li key={`${item.href}-${item.label}`}>
            <ChevronRight size={15} aria-hidden="true" />
            {item.href ? <a href={item.href}>{item.label}</a> : <span>{item.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
