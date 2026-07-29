"use client";

import { RotateCcw, SlidersHorizontal, X } from "lucide-react";

export type Filters = {
  category: string;
  grade: string;
  subject: string;
  type: string;
  format: string;
  availability: string;
  marker: string;
};

type FilterPanelProps = {
  filters: Filters;
  options: {
    categories: string[];
    grades: string[];
    subjects: string[];
    types: string[];
    formats: string[];
  };
  open: boolean;
  onChange: (key: keyof Filters, value: string) => void;
  onReset: () => void;
  onClose: () => void;
};

const SelectField = ({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) => (
  <label>
    <span>{label}</span>
    <select value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">Усі</option>
      {options.map((option) => (
        <option value={option} key={option}>
          {option}
        </option>
      ))}
    </select>
  </label>
);

export function FilterPanel({
  filters,
  options,
  open,
  onChange,
  onReset,
  onClose,
}: FilterPanelProps) {
  return (
    <>
      {open && (
        <button
          type="button"
          className="filter-backdrop"
          aria-label="Закрити фільтри"
          onClick={onClose}
        />
      )}
      <aside className={`filter-panel ${open ? "open" : ""}`}>
        <div className="filter-title">
          <span>
            <SlidersHorizontal size={21} aria-hidden="true" /> Фільтри
          </span>
          <button type="button" className="filter-close" onClick={onClose}>
            <X size={20} aria-hidden="true" />
            <span className="sr-only">Закрити фільтри</span>
          </button>
        </div>
        <div className="filter-fields">
          <SelectField
            label="Категорія"
            value={filters.category}
            options={options.categories}
            onChange={(value) => onChange("category", value)}
          />
          <SelectField
            label="Клас"
            value={filters.grade}
            options={options.grades}
            onChange={(value) => onChange("grade", value)}
          />
          <SelectField
            label="Предмет"
            value={filters.subject}
            options={options.subjects}
            onChange={(value) => onChange("subject", value)}
          />
          <SelectField
            label="Тип матеріалу"
            value={filters.type}
            options={options.types}
            onChange={(value) => onChange("type", value)}
          />
          <SelectField
            label="Формат"
            value={filters.format}
            options={options.formats}
            onChange={(value) => onChange("format", value)}
          />
          <label>
            <span>Доступ</span>
            <select
              value={filters.availability}
              onChange={(event) =>
                onChange("availability", event.target.value)
              }
            >
              <option value="">Усі</option>
              <option value="free">Безкоштовні</option>
              <option value="paid">Платні</option>
            </select>
          </label>
          <label>
            <span>Добірка</span>
            <select
              value={filters.marker}
              onChange={(event) => onChange("marker", event.target.value)}
            >
              <option value="">Усі</option>
              <option value="new">Нові</option>
              <option value="popular">Популярні</option>
            </select>
          </label>
        </div>
        <button type="button" className="reset-filters" onClick={onReset}>
          <RotateCcw size={17} aria-hidden="true" /> Очистити фільтри
        </button>
      </aside>
    </>
  );
}
