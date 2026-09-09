import { MarkdownRenderer } from "./MarkdownRenderer";
import type { EditorProps } from "@monaco-editor/react";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { Eye, FileEdit, Columns } from "lucide-react";

interface ArticleEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  filename?: string;
  editorOptions?: EditorProps["options"];
  showToggle?: boolean;
}

export function ArticleEditor({
  value,
  onChange,
  readOnly = false,
  filename = "article.md",
  editorOptions,
  showToggle = true,
}: ArticleEditorProps) {
  const readOnlyFinal = readOnly || !onChange;

  return (
    <div className="w-full h-full flex flex-col bg-retro-bgDark">
      <div className="h-[34px] shrink-0 flex items-center justify-between px-3 border-b border-retro-border bg-retro-bg">
        <div className="flex items-center gap-2 text-[11.5px] text-retro-comment">
          <Columns size={12} className="text-retro-purple" />
          <span className="uppercase tracking-widest font-semibold">
            Editor de artigo
          </span>
          <span className="mx-1.5 opacity-40">|</span>
          <span>
            <FileEdit size={11} className="inline mr-1 text-retro-blue" />
            escrever
          </span>
          <span className="opacity-50">↔</span>
          <span>
            <Eye size={11} className="inline mr-1 text-retro-green" />
            prévia
          </span>
        </div>
        {showToggle && !readOnlyFinal ? null : null}
        <div className="text-[11px] text-retro-comment font-mono">
          {filename}
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 divide-x divide-retro-border">
        <div className="min-h-0 min-w-0 border-r border-retro-border">
          <CodeEditor
            value={value}
            language="markdown"
            readOnly={readOnlyFinal}
            onChange={onChange}
            options={{
              wordWrap: "on",
              ...editorOptions,
            }}
          />
        </div>

        <div className="min-h-0 min-w-0 bg-retro-bgDark">
          <MarkdownRenderer content={value} />
        </div>
      </div>
    </div>
  );
}
