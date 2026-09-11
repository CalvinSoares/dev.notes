import {
  LayoutDashboard,
  Code2,
  Layers,
  FileCode,
  GitBranch,
  X,
  Circle,
  Menu,
  Moon,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { Tab } from "@core/types";

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  Code2,
  Layers,
  FileCode,
  GitBranch,
};

const FRIENDLY_TITLES: Record<string, string> = {
  'dashboard.review': 'Meu mural',
  'leetcode.problems': 'Desafios',
  'flashcards.deck': 'Flashcards',
  'diagrams.flow': 'Fluxogramas',
};

function IconFor({ name, size = 14 }: { name: string; size?: number }) {
  const Cmp = ICONS[name] ?? FileCode;
  return <Cmp size={size} className="text-retro-text-dim" />;
}

export function TabBar() {
  const { tabs, activeTabId, setActiveTab, closeTab, toggleSidebar, theme, toggleTheme } =
    useAppStore();

  return (
    <header
      className="shrink-0 bg-retro-bg/95 border-b-2 border-dashed border-retro-border flex items-stretch relative z-20"
      style={{ height: "var(--tabbar-height)" }}
      role="tablist"
    >
      <button
        type="button"
        onClick={toggleSidebar}
        className="md:hidden flex items-center gap-2 px-4 h-full border-r-2 border-dashed border-retro-border text-retro-text hover:bg-retro-panelHover"
        aria-label="Toggle sidebar"
      >
        <Menu size={21} strokeWidth={2.6} />
        <span className="text-[16px]">menu</span>
      </button>
      <div className="flex-1 min-w-0 flex items-stretch overflow-hidden">
        {tabs.map((t: Tab) => {
          const isActive = t.id === activeTabId;
          return (
            <div
              key={t.id}
              className={`retro-tab group ${isActive ? "active" : ""}`}
              title={t.title}
            >
              <button
                type="button"
                role="tab"
                aria-selected={isActive}
                className="h-full inline-flex items-center gap-2"
                onClick={() => setActiveTab(t.id)}
              >
                <IconFor name={t.iconName} size={16} />
                <span className="truncate">{FRIENDLY_TITLES[t.title] ?? t.title}</span>
              </button>
              {t.dirty && !isActive && (
                <Circle size={8} className="fill-retro-blue text-retro-blue" />
              )}
              <button
                type="button"
                className={`ml-1 p-1 paper-icon-button transition-opacity ${
                  isActive
                    ? "opacity-100 text-retro-text-dim hover:text-retro-red"
                    : "opacity-0 group-hover:opacity-100 hover:text-retro-red"
                } hover:bg-white`}
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(t.id);
                }}
                aria-label={`Close tab ${t.title}`}
              >
                <X size={12} />
              </button>
            </div>
          );
        })}
      </div>
      <button
        type="button"
        onClick={toggleTheme}
        className="theme-switch shrink-0 h-full px-4 border-l-2 border-dashed border-retro-border"
        aria-label={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
        title={theme === 'light' ? 'Modo escuro' : 'Modo claro'}
      >
        {theme === 'light' ? <Moon size={19} strokeWidth={2.5} /> : <Sun size={20} strokeWidth={2.5} />}
        <span className="hidden md:inline">{theme === 'light' ? 'escuro' : 'claro'}</span>
      </button>
    </header>
  );
}
