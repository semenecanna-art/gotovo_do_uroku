"use client";

import { Search, X } from "lucide-react";

export function SearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="search-bar">
      <Search size={22} aria-hidden="true" />
      <span className="sr-only">Пошук матеріалів</span>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Введіть тему, предмет або назву матеріалу"
      />
      {value && (
        <button
          type="button"
          aria-label="Очистити пошук"
          onClick={() => onChange("")}
        >
          <X size={19} aria-hidden="true" />
        </button>
      )}
    </label>
  );
}
