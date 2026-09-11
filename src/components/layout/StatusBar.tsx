import { useEffect, useState } from 'react';
import {
  GitBranch,
  Wifi,
  AlertCircle,
  Bell,
  Clock,
  CircleDot,
} from 'lucide-react';
import { useFlashcardStore } from '@/store/useFlashcardStore';
import { useLeetCodeStore } from '@/store/useLeetCodeStore';

export function StatusBar() {
  const [now, setNow] = useState<Date>(new Date());
  const dueFC = useFlashcardStore((s) => s.getDueCards().length);
  const dueLC = useLeetCodeStore((s) => s.getDueProblems().length);
  const total = dueFC + dueLC;

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const date = now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

  const items = [
    {
      key: 'branch',
      icon: <GitBranch size={12} />,
      label: 'salvo neste caderno',
      className: 'hidden sm:flex',
    },
    {
      key: 'storage',
      icon: <CircleDot size={12} className="text-retro-green" />,
      label: 'dados seguros',
    },
    {
      key: 'errors',
      icon: <AlertCircle size={12} className="text-retro-yellow" />,
      label: '0',
      className: 'hidden sm:flex',
    },
  ];

  const right = [
    {
      key: 'review',
      icon: <Bell size={12} className={total > 0 ? 'text-retro-orange' : ''} />,
      label: `${total} ${total === 1 ? 'revisão' : 'revisões'}`,
      tone: total > 0 ? 'text-retro-orange' : 'text-retro-text-dim',
    },
    {
      key: 'lc',
      label: `LC:${dueLC}`,
      className: 'hidden sm:flex',
    },
    {
      key: 'fc',
      label: `FC:${dueFC}`,
      className: 'hidden sm:flex',
    },
    {
      key: 'status',
      icon: <Wifi size={12} className="text-retro-green" />,
      label: 'em dia',
      className: 'hidden sm:flex',
    },
    {
      key: 'time',
      icon: <Clock size={12} />,
      label: `${date} ${time}`,
    },
    {
      key: 'utf',
      label: 'UTF-8',
      className: 'hidden lg:flex',
    },
    {
      key: 'lang',
      label: 'TypeScript React',
      className: 'hidden lg:flex',
    },
  ];

  return (
    <footer
      className="shrink-0 bg-retro-bgDarker border-t-2 border-dashed border-retro-border flex items-center justify-between px-2 text-[13px] text-retro-text-dim select-none relative z-20"
      style={{ height: 'var(--statusbar-height)' }}
    >
      <div className="flex items-center h-full divide-x-2 divide-dashed divide-retro-border/30">
        {items.map((it) => (
          <div
            key={it.key}
            className={`h-full flex items-center gap-1 px-2 hover:bg-retro-panelHover hover:text-retro-text transition-colors ${it.className ?? ''}`}
          >
            {it.icon}
            <span>{it.label}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center h-full divide-x-2 divide-dashed divide-retro-border/30">
        {right.map((r) => (
          <div
            key={r.key}
            className={`h-full flex items-center gap-1 px-2 hover:bg-retro-panelHover hover:text-retro-text transition-colors ${r.tone ?? ''} ${r.className ?? ''}`}
          >
            {r.icon}
            <span>{r.label}</span>
          </div>
        ))}
      </div>
    </footer>
  );
}
