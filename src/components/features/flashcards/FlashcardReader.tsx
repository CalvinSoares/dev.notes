import type { Flashcard } from "@core/types";
import { Code2, HelpCircle, Lightbulb } from "lucide-react";
import { RetroBadge } from "@/components/ui/RetroBadge";
import { CodeEditor } from "@/components/editor/CodeEditor";

export function FlashcardReader({ card }: { card: Flashcard }) {
  return (
    <article className="flex-1 min-h-0 overflow-y-auto retro-scrollbar p-4 md:p-6 bg-retro-bg">
      <div className="max-w-4xl mx-auto space-y-4">
        <section className="retro-card !p-5 md:!p-7" aria-labelledby="flashcard-question">
          <div className="flex items-center gap-2 text-retro-blue mb-4">
            <HelpCircle size={18} aria-hidden />
            <h2 id="flashcard-question" className="text-[14px] font-semibold">Pergunta</h2>
          </div>
          <p className="text-retro-text text-[18px] md:text-[20px] leading-relaxed whitespace-pre-wrap">
            {card.question}
          </p>
          {card.tags.length > 0 && (
            <div className="mt-6 pt-4 border-t border-retro-border/60 flex flex-wrap gap-2">
              {card.tags.map((tag) => <RetroBadge key={tag} tone="blue">{tag}</RetroBadge>)}
            </div>
          )}
        </section>

        <section className="retro-card !p-5 md:!p-7" aria-labelledby="flashcard-answer">
          <div className="flex items-center gap-2 text-retro-yellow mb-4">
            <Lightbulb size={18} aria-hidden />
            <h2 id="flashcard-answer" className="text-[14px] font-semibold">Resposta</h2>
          </div>
          <p className="text-retro-text text-[16px] md:text-[17px] leading-relaxed whitespace-pre-wrap">
            {card.answer}
          </p>
        </section>

        {card.codeSnippet && (
          <section className="retro-card !p-0 overflow-hidden" aria-labelledby="flashcard-code">
            <div className="px-5 py-3 border-b border-retro-border/60 flex items-center gap-2">
              <Code2 size={16} className="text-retro-purple" aria-hidden />
              <h2 id="flashcard-code" className="text-[14px] font-semibold text-retro-text">Exemplo de código</h2>
            </div>
            <div className="h-72">
              <CodeEditor
                value={card.codeSnippet}
                language={(card.language as "typescript") ?? "typescript"}
                readOnly
                filename={`snippet.${card.language ?? "ts"}`}
              />
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
