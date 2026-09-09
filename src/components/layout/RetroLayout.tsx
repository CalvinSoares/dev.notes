import { useEffect, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TabBar } from './TabBar';
import { StatusBar } from './StatusBar';
import { useAppStore } from '@/store/useAppStore';

interface RetroLayoutProps {
  content: ReactNode;
}

export function RetroLayout({ content }: RetroLayoutProps) {
  const theme = useAppStore((state) => state.theme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <div data-theme={theme} className="h-screen w-screen flex flex-col bg-retro-bg text-retro-text overflow-hidden">
      <div className="flex-1 flex min-h-0">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TabBar />
          <main className="flex-1 min-h-0 overflow-y-auto retro-scrollbar bg-retro-bg paper-page">
            {content}
          </main>
        </div>
      </div>
      <StatusBar />
    </div>
  );
}
