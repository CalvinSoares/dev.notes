import { useEffect, useState } from 'react';
import { RetroLayout } from '@/components/layout/RetroLayout';
import { useAppStore } from '@/store/useAppStore';
import { useFlashcardStore } from '@/store/useFlashcardStore';
import { useLeetCodeStore } from '@/store/useLeetCodeStore';
import { useContentStore } from '@/store/useContentStore';
import { useStudyPhaseStore } from '@/store/useStudyPhaseStore';
import { useDiagramStore } from '@/store/useDiagramStore';
import { DashboardPage } from '@/pages/DashboardPage';
import { LeetCodePage } from '@/pages/LeetCodePage';
import { FlashcardsPage } from '@/pages/FlashcardsPage';
import { ContentPage } from '@/pages/ContentPage';
import { FileQuestion, PencilLine, Sparkles } from 'lucide-react';
import { DiagramsPage } from '@/pages/DiagramsPage';
import type { PageId } from '@core/types';

const PAGE_REGISTRY: Record<PageId, () => JSX.Element> = {
  dashboard: DashboardPage,
  leetcode: LeetCodePage,
  flashcards: FlashcardsPage,
  articles: ContentPage,
  snippets: ContentPage,
  diagrams: DiagramsPage,
};

function FallbackPage({ pageId }: { pageId: PageId }) {
  return (
    <div className="h-full p-8 flex flex-col items-center justify-center text-center paper-page">
      <FileQuestion size={48} className="text-retro-comment mb-4" />
      <h2 className="text-retro-orange text-2xl font-bold">
        Esta página escapou do caderno!
      </h2>
      <p className="text-retro-text-dim text-[16px] mt-2 max-w-md">
        Não encontramos &ldquo;{pageId}&rdquo;. Use as páginas do menu para continuar estudando.
      </p>
    </div>
  );
}

function ActivePage() {
  const { tabs, activeTabId } = useAppStore();
  const active = tabs.find((t) => t.id === activeTabId) ?? tabs[0];
  if (!active) return null;
  const PageCmp = PAGE_REGISTRY[active.pageId];
  if (!PageCmp) return <FallbackPage pageId={active.pageId} />;
  return <PageCmp key={active.id} />;
}

function BootSplash({ step }: { step: string }) {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-retro-bg text-retro-text overflow-hidden paper-page p-6">
      <div className="relative w-full max-w-lg p-8 border-[3px] border-retro-border bg-retro-bgDark rounded-wobblyMd shadow-paper-lg rotate-[-.5deg]">
        <span className="sidebar-tape" aria-hidden />
        <div className="flex items-center gap-3 text-retro-blue mb-5">
          <span className="logo-scribble"><PencilLine size={24} /></span>
          <div>
            <h1 className="font-display text-3xl font-bold text-retro-text leading-none">dev.notes</h1>
            <span className="text-[14px] text-retro-comment">abrindo seu caderno...</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[16px] text-retro-text-dim">
          <Sparkles size={17} className="text-retro-orange animate-pulse" />
          <span>{step}</span>
        </div>
        <div className="mt-5 h-[8px] border-2 border-retro-border rounded-wobbly overflow-hidden bg-retro-bg">
          <div className="h-full w-1/3 bg-retro-orange animate-[slide_1.6s_ease-in-out_infinite]" />
        </div>
        <style>{`@keyframes slide { 0% { transform: translateX(-110%); } 100% { transform: translateX(330%); } }`}</style>
      </div>
    </div>
  );
}

export function App() {
  const [booting, setBooting] = useState(true);
  const [step, setStep] = useState('mounting app shell...');
  const fcInit = useFlashcardStore((s) => s.initialize);
  const lcInit = useLeetCodeStore((s) => s.initialize);
  const ctInit = useContentStore((s) => s.initialize);
  const phaseInit = useStudyPhaseStore((s) => s.initialize);
  const diagramInit = useDiagramStore((s) => s.initialize);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await new Promise((r) => setTimeout(r, 150));
      if (cancelled) return;
      setStep('hydrating useFlashcardStore()');
      await fcInit();
      if (cancelled) return;
      setStep('hydrating useLeetCodeStore()');
      await lcInit();
      if (cancelled) return;
      setStep('hydrating useContentStore()');
      await ctInit();
      if (cancelled) return;
      setStep('organizando fases de estudo');
      await phaseInit();
      if (cancelled) return;
      setStep('carregando fluxogramas');
      await diagramInit();
      if (cancelled) return;
      setStep('layout: ready');
      await new Promise((r) => setTimeout(r, 120));
      if (!cancelled) setBooting(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [fcInit, lcInit, ctInit, phaseInit, diagramInit]);

  if (booting) return <BootSplash step={step} />;
  return <RetroLayout content={<ActivePage />} />;
}

export default App;
