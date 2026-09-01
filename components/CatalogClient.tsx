"use client";

import { Filter, Grid3X3, ListFilter, SearchCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import {
  FilterPanel,
  type Filters,
} from "@/components/FilterPanel";
import { MaterialCard } from "@/components/MaterialCard";
import { SearchBar } from "@/components/SearchBar";
import type { MaterialSummary } from "@/lib/types";

const emptyFilters: Filters = {
  category: "",
  grade: "",
  subject: "",
  type: "",
  format: "",
  availability: "",
  marker: "",
};

const uniqueSorted = (values: string[]) =>
  Array.from(new Set(values.filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, "uk"),
  );

export function CatalogClient({
  items,
  initialFreeOnly = false,
}: {
  items: MaterialSummary[];
  initialFreeOnly?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>({
    ...emptyFilters,
    availability: initialFreeOnly ? "free" : "",
  });
  const [sort, setSort] = useState("new");
  const [filterOpen, setFilterOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(24);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const category = params.get("category");
    const search = params.get("search");
    if (category) {
      setFilters((current) => ({ ...current, category }));
    }
    if (search) setQuery(search);
  }, []);

  const options = useMemo(
    () => ({
      categories: uniqueSorted(items.map((item) => item.category)),
      grades: uniqueSorted(items.map((item) => item.grade)),
      subjects: uniqueSorted(items.map((item) => item.subject)),
      types: uniqueSorted(items.map((item) => item.materialType)),
      formats: uniqueSorted(items.map((item) => item.fileFormat)),
    }),
    [items],
  );

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("uk");
    const result = items.filter((item) => {
      const haystack = [
        item.title,
        item.shortDescription,
        item.category,
        item.subject,
        item.grade,
        item.materialType,
        item.fileFormat,
      ]
        .join(" ")
        .toLocaleLowerCase("uk");
      return (
        (!normalizedQuery || haystack.includes(normalizedQuery)) &&
        (!filters.category || item.category === filters.category) &&
        (!filters.grade || item.grade === filters.grade) &&
        (!filters.subject || item.subject === filters.subject) &&
        (!filters.type || item.materialType === filters.type) &&
        (!filters.format || item.fileFormat === filters.format) &&
        (!filters.availability ||
          (filters.availability === "free" ? item.isFree : !item.isFree)) &&
        (!filters.marker ||
          (filters.marker === "new" ? item.isNew : item.isPopular))
      );
    });

    return result.sort((a, b) => {
      if (sort === "popular") return b.views - a.views;
      if (sort === "title") return a.title.localeCompare(b.title, "uk");
      if (sort === "free") return Number(b.isFree) - Number(a.isFree);
      if (sort === "paid") return Number(a.isFree) - Number(b.isFree);
      const bDate = Date.parse(b.createdAt) || 0;
      const aDate = Date.parse(a.createdAt) || 0;
      return bDate - aDate || Number(b.isNew) - Number(a.isNew);
    });
  }, [filters, items, query, sort]);

  useEffect(() => setVisibleCount(24), [query, filters, sort]);

  const updateFilter = (key: keyof Filters, value: string) =>
    setFilters((current) => ({ ...current, [key]: value }));

  const resetFilters = () => {
    setFilters({
      ...emptyFilters,
      availability: initialFreeOnly ? "free" : "",
    });
    setQuery("");
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="catalog-shell">
      <div className="catalog-toolbar">
        <SearchBar value={query} onChange={setQuery} />
        <button
          type="button"
          className="button button-secondary mobile-filter-button"
          onClick={() => setFilterOpen(true)}
        >
          <Filter size={19} aria-hidden="true" />
          Фільтри
          {activeFilterCount > 0 && <span>{activeFilterCount}</span>}
        </button>
      </div>

      <div className="catalog-layout">
        <FilterPanel
          filters={filters}
          options={options}
          open={filterOpen}
          onChange={updateFilter}
          onReset={resetFilters}
          onClose={() => setFilterOpen(false)}
        />

        <div className="catalog-results">
          <div className="results-bar">
            <p aria-live="polite">
              <SearchCheck size={19} aria-hidden="true" />
              Знайдено: <strong>{filtered.length}</strong>
            </p>
            <label className="sort-select">
              <ListFilter size={18} aria-hidden="true" />
              <span className="sr-only">Сортування</span>
              <select value={sort} onChange={(event) => setSort(event.target.value)}>
                <option value="new">Спочатку нові</option>
                <option value="popular">Спочатку популярні</option>
                <option value="title">За назвою</option>
                <option value="free">Спочатку безкоштовні</option>
                <option value="paid">Спочатку платні</option>
              </select>
            </label>
          </div>

          {filtered.length ? (
            <>
              <div className="material-grid">
                {filtered.slice(0, visibleCount).map((material) => (
                  <MaterialCard key={material.id} material={material} />
                ))}
              </div>
              {visibleCount < filtered.length && (
                <button
                  type="button"
                  className="button button-primary load-more"
                  onClick={() => setVisibleCount((count) => count + 24)}
                >
                  <Grid3X3 size={19} aria-hidden="true" />
                  Показати ще
                </button>
              )}
            </>
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </div>
  );
}
