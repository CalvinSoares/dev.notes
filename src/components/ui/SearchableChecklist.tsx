import { useMemo, useState } from "react";
import { Search } from "lucide-react";

export interface SearchableChecklistItem {
  id: string;
  label: string;
  description?: string;
}

export function SearchableChecklist({
  items,
  values,
  onToggle,
  empty,
  placeholder = "Buscar...",
  maxHeight = "max-h-64",
}: {
  items: SearchableChecklistItem[];
  values: string[];
  onToggle: (id: string) => void;
  empty: string;
  placeholder?: string;
  maxHeight?: string;
}) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredItems = useMemo(
    () => normalizedQuery
      ? items.filter((item) => `${item.label} ${item.description ?? ""}`.toLocaleLowerCase().includes(normalizedQuery))
      : items,
    [items, normalizedQuery],
  );

  return (
    <div className="space-y-2">
      <label className="relative block">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-retro-comment" aria-hidden />
        <input value={query} onChange={(event) => setQuery(event.target.value)} className="retro-input w-full pl-9 text-[12px]" placeholder={placeholder} aria-label={placeholder} />
      </label>
      <div className={`${maxHeight} overflow-y-auto retro-scrollbar space-y-1`}>
        {filteredItems.length > 0 ? filteredItems.map((item) => (
          <label key={item.id} className="phase-choice">
            <input type="checkbox" checked={values.includes(item.id)} onChange={() => onToggle(item.id)} className="sketch-checkbox" />
            <span className="min-w-0">
              <span className="block text-[13px] text-retro-text leading-snug">{item.label}</span>
              {item.description && <span className="block mt-1 text-[11px] text-retro-comment line-clamp-2">{item.description}</span>}
            </span>
          </label>
        )) : <p className="p-3 text-[12px] text-retro-comment">{items.length ? "Nenhum item corresponde à busca." : empty}</p>}
      </div>
    </div>
  );
}
