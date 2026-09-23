import { useState } from "react";
import type { Flashcard } from "@core/types";
import { RetroBadge } from "@/components/ui/RetroBadge";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { HelpCircle, Lightbulb, RotateCw } from "lucide-react";

interface FlipCardProps {
  card: Flashcard;
  flipped?: boolean;
  onFlipChange?: (flipped: boolean) => void;
  revealDisabled?: boolean;
}

export function FlipCard({ card, flipped: controlledFlipped, onFlipChange, revealDisabled = false }: FlipCardProps) {
  const [internalFlipped, setInternalFlipped] = useState(false);
  const isControlled = controlledFlipped !== undefined;
  const flipped = isControlled ? controlledFlipped : internalFlipped;

  const handleFlip = () => {
    if (revealDisabled) return;
    const next = !flipped;
    if (!isControlled) setInternalFlipped(next);
    onFlipChange?.(next);
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div className="flip-scene w-full max-w-3xl aspect-[16/10] min-h-[360px]" style={{ perspective: "1600px" }}>
        <div
          className={`flip-card relative w-full h-full ${revealDisabled ? "cursor-not-allowed" : "cursor-pointer"} transition-transform duration-500`}
          style={{ transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
          onClick={handleFlip}
          onKeyDown={(event) => {
            if (revealDisabled) return;
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              handleFlip();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label={revealDisabled ? "Responda abaixo para revelar" : flipped ? "Ocultar resposta" : "Mostrar resposta"}
        >
          <div className="flip-face absolute inset-0 border-[3px] border-retro-border bg-retro-bgDark flex flex-col shadow-paper-lg" style={{ backfaceVisibility: "hidden", borderRadius: "var(--radius-wobbly-md)" }} aria-hidden={flipped}>
            <div className="flex items-center justify-between px-4 py-2 border-b border-retro-border bg-retro-bg">
              <div className="flex items-center gap-2"><HelpCircle size={14} className="text-retro-blue" /><span className="text-[11px] uppercase tracking-[0.15em] text-retro-comment font-semibold">Pergunta</span></div>
              <div className="flex items-center gap-2">
                {card.language && <RetroBadge tone="purple">{card.language}</RetroBadge>}
                <RetroBadge tone="default"><RotateCw size={10} /> {revealDisabled ? "responder abaixo" : "virar"}</RetroBadge>
              </div>
            </div>
            <div className="flex-1 min-h-0 p-6 overflow-y-auto retro-scrollbar flex flex-col">
              <h2 className="text-retro-text text-[18px] leading-relaxed font-medium">{card.question}</h2>
              <div className="mt-auto pt-6 flex items-center gap-1.5 flex-wrap">{card.tags.map((tag) => <RetroBadge key={tag} tone="blue">#{tag}</RetroBadge>)}</div>
            </div>
            <div className="px-4 py-2 border-t border-retro-border text-[11px] text-retro-comment text-center">{revealDisabled ? "Digite sua resposta abaixo para revelar o verso" : "Clique ou pressione Enter para revelar a resposta"}</div>
          </div>

          <div className="flip-face absolute inset-0 border-[3px] border-retro-blue bg-retro-bgDark flex flex-col shadow-paper-lg" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", borderRadius: "var(--radius-wobbly-md)" }} aria-hidden={!flipped}>
            <div className="flex items-center justify-between px-4 py-2 border-b border-retro-border bg-retro-bg">
              <div className="flex items-center gap-2"><Lightbulb size={14} className="text-retro-yellow" /><span className="text-[11px] uppercase tracking-[0.15em] text-retro-comment font-semibold">Resposta</span></div>
              <RetroBadge tone="green"><RotateCw size={10} /> voltar</RetroBadge>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              <div className="p-5 overflow-y-auto retro-scrollbar border-b border-retro-border flex-shrink-0 max-h-[45%]"><p className="text-retro-text text-[14.5px] leading-relaxed whitespace-pre-wrap">{card.answer}</p></div>
              {card.codeSnippet ? <div className="flex-1 min-h-0"><CodeEditor value={card.codeSnippet} language={(card.language as any) ?? "typescript"} readOnly={true} filename={`snippet.${card.language ?? "ts"}`} /></div> : <div className="flex-1 flex items-center justify-center text-retro-comment text-[12px] italic">Sem trecho de código neste cartão.</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}