import { createPortal } from "react-dom";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

export interface SearchableDropdownItem {
  id: string;
  label: string;
  description?: string;
}

type DropdownPosition = {
  top: number;
  left: number;
  width: number;
  listMaxHeight: number;
};

const shorten = (value: string, limit: number) => value.length > limit ? value.slice(0, Math.max(1, limit - 1)) + "…" : value;
const DROPDOWN_GAP = 8;
const DROPDOWN_HEADER_HEIGHT = 58;
const DROPDOWN_MAX_LIST_HEIGHT = 288;
const DROPDOWN_MIN_LIST_HEIGHT = 140;

export function SearchableDropdown({
  items,
  value,
  values = [],
  onChange,
  onToggle,
  multiple = false,
  showCheckbox = multiple,
  placeholder = "Selecionar...",
  searchPlaceholder = "Buscar...",
  empty = "Nenhum item disponível.",
  charLimit = 72,
  searchCharLimit = 100,
}: {
  items: SearchableDropdownItem[];
  value?: string;
  values?: string[];
  onChange?: (id: string) => void;
  onToggle?: (id: string) => void;
  multiple?: boolean;
  showCheckbox?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  empty?: string;
  charLimit?: number;
  searchCharLimit?: number;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState<DropdownPosition | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedIds = multiple ? values : value ? [value] : [];
  const selectedItems = items.filter((item) => selectedIds.includes(item.id));
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredItems = useMemo(
    () => normalizedQuery
      ? items.filter((item) => (item.label + " " + (item.description ?? "")).toLocaleLowerCase().includes(normalizedQuery))
      : items,
    [items, normalizedQuery],
  );

  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }

    const updatePosition = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom - 16;
      const spaceAbove = rect.top - 16;
      const openAbove = spaceBelow < DROPDOWN_HEADER_HEIGHT + DROPDOWN_MIN_LIST_HEIGHT && spaceAbove > spaceBelow;
      const availableSpace = openAbove ? spaceAbove : spaceBelow;
      const listMaxHeight = Math.max(
        DROPDOWN_MIN_LIST_HEIGHT,
        Math.min(DROPDOWN_MAX_LIST_HEIGHT, availableSpace - DROPDOWN_HEADER_HEIGHT - DROPDOWN_GAP),
      );
      const panelHeight = DROPDOWN_HEADER_HEIGHT + listMaxHeight;
      const top = openAbove
        ? Math.max(8, rect.top - panelHeight - DROPDOWN_GAP)
        : Math.min(rect.bottom + DROPDOWN_GAP, Math.max(8, window.innerHeight - panelHeight - 8));
      const width = Math.max(rect.width, 280);
      const left = Math.min(Math.max(8, rect.left), Math.max(8, window.innerWidth - width - 8));

      setPosition({ top, left, width, listMaxHeight });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, filteredItems.length]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || dropdownRef.current?.contains(target)) return;
      setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleSelect = (id: string) => {
    if (multiple) {
      onToggle?.(id);
      return;
    }
    onChange?.(id);
    setOpen(false);
    setQuery("");
  };

  const triggerLabel = selectedItems.length === 0
    ? placeholder
    : multiple
      ? selectedItems.length + " item(ns) selecionado(s)"
      : shorten(selectedItems[0].label, charLimit);

  const menu = open && position ? (
    <div
      ref={dropdownRef}
      className="fixed z-[100] overflow-hidden rounded-lg border-2 border-retro-border bg-retro-bgDark shadow-[6px_6px_0_rgba(0,0,0,0.18)]"
      style={{ top: position.top, left: position.left, width: position.width }}
    >
      <div className="border-b border-retro-border/60 p-2">
        <label className="relative block">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-retro-comment" aria-hidden />
          <input autoFocus value={query} maxLength={searchCharLimit} onChange={(event) => setQuery(event.target.value)} className="retro-input w-full pl-9 text-[12px]" placeholder={searchPlaceholder} aria-label={searchPlaceholder} />
        </label>
      </div>
      <div className="overflow-y-auto retro-scrollbar p-2" style={{ maxHeight: position.listMaxHeight }} role="listbox" aria-multiselectable={multiple}>
        {filteredItems.length > 0 ? filteredItems.map((item) => {
          const selected = selectedIds.includes(item.id);
          return <button key={item.id} type="button" role="option" aria-selected={selected} className={"flex w-full items-start gap-2 rounded-md p-2 text-left transition-colors " + (selected ? "bg-retro-blue/10 border border-retro-blue/60" : "border border-transparent hover:border-retro-border hover:bg-retro-panelHover")} onClick={() => handleSelect(item.id)}>
            {showCheckbox && <span aria-hidden className={"mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border " + (selected ? "border-retro-blue bg-retro-blue text-white" : "border-retro-border bg-retro-bg")}>{selected && <Check size={11} />}</span>}
            <span className="min-w-0 flex-1">
              <span className="block text-[12px] leading-snug text-retro-text" title={item.label}>{shorten(item.label, charLimit)}</span>
              {item.description && <span className="mt-1 block line-clamp-2 text-[11px] leading-snug text-retro-comment" title={item.description}>{shorten(item.description, charLimit * 2)}</span>}
            </span>
          </button>;
        }) : <p className="p-4 text-center text-[12px] text-retro-comment">{items.length ? "Nenhum item corresponde à busca." : empty}</p>}
      </div>
    </div>
  ) : null;

  return (
    <div ref={rootRef} className="relative">
      <button ref={triggerRef} type="button" className="retro-input w-full min-h-10 flex items-center justify-between gap-3 text-left" onClick={() => setOpen((current) => !current)} aria-expanded={open} aria-haspopup="listbox">
        <span className={selectedItems.length ? "min-w-0 truncate text-retro-text" : "min-w-0 truncate text-retro-comment"} title={selectedItems[0]?.label}>{triggerLabel}</span>
        <ChevronDown size={15} className={"shrink-0 text-retro-comment transition-transform " + (open ? "rotate-180" : "")} />
      </button>
      {typeof document !== "undefined" && createPortal(menu, document.body)}
    </div>
  );
}