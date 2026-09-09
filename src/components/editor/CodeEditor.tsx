import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { useAppStore } from '@/store/useAppStore';
import { Maximize2, Minimize2, X } from 'lucide-react';
import { createPortal } from 'react-dom';

type SupportedLang =
  | 'typescript'
  | 'javascript'
  | 'python'
  | 'json'
  | 'markdown'
  | 'html'
  | 'css';

interface CodeEditorProps {
  value: string;
  language?: SupportedLang;
  readOnly?: boolean;
  onChange?: (v: string) => void;
  height?: string | number;
  filename?: string;
  options?: editor.IStandaloneEditorConstructionOptions;
  className?: string;
  expandable?: boolean;
}

const THEME_PREFIX = 'devnotes';

function ensureTheme(monaco: typeof import('monaco-editor'), themeName: string) {
  const already = (monaco.editor as any)._themeData?.[themeName];
  if (already) return;
  const cssToken = (name: string) =>
    getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const syntaxToken = (name: string) =>
    cssToken(name)
      .split(/\s+/)
      .map((channel) => Number(channel).toString(16).padStart(2, '0'))
      .join('');
  const editorColor = (name: string) => `#${syntaxToken(name)}`;
  monaco.editor.defineTheme(themeName, {
    base: 'vs',
    inherit: true,
    rules: [
      { token: '', foreground: syntaxToken('--rgb-ink'), background: syntaxToken('--rgb-code-canvas') },
      { token: 'comment', foreground: syntaxToken('--rgb-ink-subtle'), fontStyle: 'italic' },
      { token: 'number', foreground: syntaxToken('--rgb-secondary') },
      { token: 'string', foreground: syntaxToken('--rgb-highlight-ink') },
      { token: 'keyword', foreground: syntaxToken('--rgb-accent'), fontStyle: 'bold' },
      { token: 'keyword.operator', foreground: syntaxToken('--rgb-accent') },
      { token: 'type', foreground: syntaxToken('--rgb-secondary') },
      { token: 'type.identifier', foreground: syntaxToken('--rgb-secondary') },
      { token: 'function', foreground: syntaxToken('--rgb-secondary') },
      { token: 'variable', foreground: syntaxToken('--rgb-ink') },
      { token: 'variable.parameter', foreground: syntaxToken('--rgb-danger') },
      { token: 'tag', foreground: syntaxToken('--rgb-accent') },
      { token: 'metatag', foreground: syntaxToken('--rgb-secondary') },
      { token: 'attribute.name', foreground: syntaxToken('--rgb-secondary') },
      { token: 'attribute.value', foreground: syntaxToken('--rgb-highlight-ink') },
    ],
    colors: {
      'editor.foreground': editorColor('--rgb-ink'),
      'editor.background': editorColor('--rgb-code-canvas'),
      'editor.selectionBackground': editorColor('--rgb-code-selection'),
      'editor.lineHighlightBackground': editorColor('--rgb-code-line'),
      'editorCursor.foreground': editorColor('--rgb-accent'),
      'editorWhitespace.foreground': editorColor('--rgb-paper-line'),
      'editorIndentGuide.background1': editorColor('--rgb-paper-line'),
      'editorLineNumber.foreground': editorColor('--rgb-code-gutter'),
      'editorLineNumber.activeForeground': editorColor('--rgb-secondary'),
      'editorGutter.background': editorColor('--rgb-code-canvas'),
      'editorSuggestWidget.background': editorColor('--rgb-surface'),
      'editorSuggestWidget.border': editorColor('--rgb-ink'),
      'editorSuggestWidget.selectedBackground': editorColor('--rgb-highlight'),
      'editorHoverWidget.background': editorColor('--rgb-surface'),
      'editorHoverWidget.border': editorColor('--rgb-ink'),
    },
  });
}

export function CodeEditor({
  value,
  language = 'typescript',
  readOnly = false,
  onChange,
  height = '100%',
  filename,
  options,
  expandable = true,
  ...rest
}: CodeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof import('monaco-editor') | null>(null);
  const onChangeRef = useRef(onChange);
  const initialValueRef = useRef(value);
  const valueRef = useRef(value);
  const [expanded, setExpanded] = useState(false);
  const appTheme = useAppStore((state) => state.theme);
  const monacoTheme = `${THEME_PREFIX}-${appTheme}`;

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  // Keep Monaco in charge while the user is typing. Passing `value` back to the
  // React wrapper on every keystroke can recreate its controlled update cycle
  // and steal text focus in a modal or a detail panel.
  useEffect(() => {
    const instance = editorRef.current;
    if (!instance || instance.getValue() === value) return;

    const hadFocus = instance.hasTextFocus();
    const selection = instance.getSelection();
    instance.setValue(value);

    if (hadFocus) {
      if (selection) instance.setSelection(selection);
      instance.focus();
    }
  }, [value]);

  const handleChange = useCallback((nextValue: string | undefined) => {
    onChangeRef.current?.(nextValue ?? '');
  }, []);

  const onMount: OnMount = useCallback((e, monaco) => {
    ensureTheme(monaco, monacoTheme);
    monaco.editor.setTheme(monacoTheme);
    editorRef.current = e;
    monacoRef.current = monaco;
    if (e.getValue() !== valueRef.current) e.setValue(valueRef.current);
    if (expanded && !readOnly) window.requestAnimationFrame(() => e.focus());
  }, [expanded, monacoTheme, readOnly]);

  useEffect(() => {
    if (!expanded || !editorRef.current) return;
    const frame = window.requestAnimationFrame(() => {
      editorRef.current?.layout();
      if (!readOnly) editorRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [expanded, readOnly]);

  useEffect(() => {
    if (!monacoRef.current) return;
    ensureTheme(monacoRef.current, monacoTheme);
    monacoRef.current.editor.setTheme(monacoTheme);
  }, [monacoTheme]);

  const finalOptions = useMemo<editor.IStandaloneEditorConstructionOptions>(
    () => ({
      readOnly,
      minimap: { enabled: false },
      fontSize: 14,
      fontFamily:
        '"JetBrains Mono", "Fira Code", "Cascadia Code", Consolas, monospace',
      fontLigatures: true,
      lineNumbers: 'on',
      smoothScrolling: true,
      cursorBlinking: 'smooth',
      renderLineHighlight: 'all',
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      wordWrap: 'on',
      bracketPairColorization: { enabled: true },
      guides: { bracketPairs: true },
      padding: { top: 12, bottom: 12 },
      ...options,
    }),
    [readOnly, options],
  );

  const label = filename ?? 'editor de código';

  const editorView = (
    <>
      {expanded && <div className="fixed inset-0 z-[80] modal-backdrop" aria-hidden onClick={() => setExpanded(false)} />}
      <div
        role={expanded ? 'dialog' : undefined}
        aria-modal={expanded || undefined}
        aria-label={expanded ? `Editor em tela cheia: ${label}` : undefined}
        className={expanded
          ? 'fixed inset-3 md:inset-6 z-[85] min-h-0 flex flex-col bg-retro-bg border border-retro-border rounded-xl overflow-hidden shadow-paper-lg'
          : 'w-full h-full min-h-0 flex flex-col bg-retro-bg border-l-2 border-r-2 border-retro-border overflow-hidden'}
      >
        {(filename || expandable) && (
          <div className="h-10 shrink-0 flex items-center justify-between gap-3 px-3 bg-retro-bgDark border-b border-retro-border text-[13px] text-retro-text-dim">
            <div className="min-w-0 flex items-center gap-2">
              <span className="text-retro-comment">›</span>
              <span className="text-retro-blue truncate">{label}</span>
              {expanded && <span className="hidden sm:inline text-retro-comment">modo de foco</span>}
            </div>
            {expandable && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="code-editor-action"
                  onClick={() => setExpanded((current) => !current)}
                  aria-label={expanded ? 'Sair da tela cheia' : 'Abrir em tela cheia'}
                  title={expanded ? 'Sair da tela cheia' : 'Abrir em tela cheia'}
                >
                  {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
                {expanded && (
                  <button
                    type="button"
                    className="code-editor-action"
                    onClick={() => setExpanded(false)}
                    aria-label="Fechar editor em tela cheia"
                    title="Fechar"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        <div
          className="flex-1 min-h-0"
          onMouseDownCapture={() => {
            if (!readOnly) window.requestAnimationFrame(() => editorRef.current?.focus());
          }}
        >
          <Editor
            height={expanded ? '100%' : typeof height === 'number' ? `${height}px` : height}
            defaultLanguage={language}
            language={language}
            defaultValue={initialValueRef.current}
            theme={monacoTheme}
            onMount={onMount}
            onChange={handleChange}
            options={finalOptions}
            loading={
              <div className="h-full flex items-center justify-center text-retro-comment text-[13px]">
                carregando editor...
              </div>
            }
            {...rest}
          />
        </div>
      </div>
    </>
  );

  return expanded ? createPortal(editorView, document.body) : editorView;
}
