import {
  LayoutDashboard,
  Code2,
  Layers,
  GitBranch,
  ClipboardCheck,
  X,
  PencilLine,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useFlashcardStore } from '@/store/useFlashcardStore';
import { useLeetCodeStore } from '@/store/useLeetCodeStore';
import type { PageId } from '@core/types';

interface NavItem {
  id: string;
  pageId: PageId;
  label: string;
  note: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'nav-dashboard', pageId: 'dashboard', label: 'Meu mural', note: 'visão do dia', icon: LayoutDashboard },
  { id: 'nav-lc', pageId: 'leetcode', label: 'Desafios', note: 'leetcode', icon: Code2 },
  { id: 'nav-fc', pageId: 'flashcards', label: 'Flashcards', note: 'memória ativa', icon: Layers },
  { id: 'nav-diagrams', pageId: 'diagrams', label: 'Fluxogramas', note: 'pensamento visual', icon: GitBranch },
  { id: 'nav-quizzes', pageId: 'quizzes', label: 'Simulados', note: 'provas e questões', icon: ClipboardCheck },
];

export function Sidebar() {
  const { openTab, activeTabId, tabs, sidebarOpen, setSidebarOpen, sidebarCollapsed, toggleSidebarCollapsed } = useAppStore();
  const activePageId = tabs.find((tab) => tab.id === activeTabId)?.pageId;
  const dueFc = useFlashcardStore((state) => state.getDueCards().length);
  const dueLc = useLeetCodeStore((state) => state.getDueProblems().length);
  const totalByNav: Record<string, number> = { 'nav-lc': dueLc, 'nav-fc': dueFc };
  const total = dueFc + dueLc;

  return (
    <>
      {sidebarOpen && (
        <button
          type="button"
          className="md:hidden fixed inset-0 bg-retro-text/25 z-30"
          onClick={() => setSidebarOpen(false)}
          aria-label="Fechar menu"
        />
      )}
      <aside
        className={`sketch-sidebar shrink-0 flex flex-col overflow-hidden transition-[width,transform] duration-200 ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } fixed md:relative inset-y-0 left-0 z-40 md:z-0`}
        aria-label="Navegação principal"
      >
        <div className={`sidebar-header relative pt-7 border-b-2 border-dashed border-retro-border ${sidebarCollapsed ? 'px-2 pb-10' : 'px-5 pb-5'}`}>
          <span className="sidebar-tape" aria-hidden />
          <button
            type="button"
            className="md:hidden absolute top-3 right-3 paper-icon-button p-2 text-retro-text-dim hover:text-retro-red"
            onClick={() => setSidebarOpen(false)}
            aria-label="Fechar menu"
          >
            <X size={19} strokeWidth={2.7} />
          </button>
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
            <span className="logo-scribble"><PencilLine size={25} strokeWidth={2.8} /></span>
            {!sidebarCollapsed && <div>
              <p className="font-display text-[25px] leading-none font-bold text-retro-text">dunots</p>
              <p className="text-[13px] text-retro-comment mt-1">seu caderno de estudos</p>
            </div>}
          </div>
          <button
            type="button"
            className={`hidden md:flex absolute items-center justify-center p-1.5 text-retro-text-dim hover:text-retro-blue hover:bg-retro-panelHover rounded ${sidebarCollapsed ? 'right-1/2 bottom-1 translate-x-1/2' : 'right-2 bottom-2'}`}
            onClick={toggleSidebarCollapsed}
            aria-label={sidebarCollapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
            title={sidebarCollapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
          >
            {sidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>

        <nav className={`flex-1 overflow-y-auto retro-scrollbar py-5 ${sidebarCollapsed ? 'px-2' : 'px-3'}`} aria-label="Cadernos">
          {!sidebarCollapsed && <p className="px-3 mb-3 text-[13px] uppercase tracking-[.14em] text-retro-comment">páginas do caderno</p>}
          <div className="space-y-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const count = totalByNav[item.id] ?? 0;
              const isActive = activePageId === item.pageId;
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => {
                    openTab(item.pageId);
                    if (window.innerWidth < 768) setSidebarOpen(false);
                  }}
                  title={sidebarCollapsed ? `${item.label} · ${item.note}` : undefined}
                  className={`retro-sb-item relative w-full text-left ${sidebarCollapsed ? '!justify-center !px-1 !gap-0' : ''} ${isActive ? 'active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className="sidebar-nav-icon"><Icon size={19} strokeWidth={2.6} /></span>
                  {!sidebarCollapsed && <span className="min-w-0 flex-1">
                    <span className="block text-[17px] leading-none text-retro-text">{item.label}</span>
                    <span className="block text-[12px] leading-none mt-1 text-retro-comment">{item.note}</span>
                  </span>}
                  {count > 0 && <span className={`due-pin ${sidebarCollapsed ? 'due-pin--collapsed' : ''}`} aria-label={`${count} pendentes`}>{count}</span>}
                </button>
              );
            })}
          </div>
        </nav>

        {!sidebarCollapsed && <div className="m-4 mt-0 p-3 bg-retro-panelHover border-2 border-retro-border rotate-[-1deg] shadow-paper">
          <div className="flex items-start gap-2">
            <Sparkles size={17} className="text-retro-orange shrink-0 mt-0.5" />
            <div>
              <p className="font-display font-bold text-[15px]">Lembrete de hoje</p>
              <p className="text-[13px] text-retro-text-dim leading-tight mt-1">
                {total > 0 ? `${total} ${total === 1 ? 'revisão espera' : 'revisões esperam'} por você.` : 'Tudo revisado. Boa pausa!'}
              </p>
            </div>
          </div>
        </div>}
      </aside>
    </>
  );
}
