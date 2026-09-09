import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const rendered = useMemo(() => content ?? '', [content]);

  return (
    <div className={`markdown-body p-6 overflow-y-auto retro-scrollbar w-full h-full ${className}`}>
      {rendered ? (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[[rehypeHighlight, { detect: true, ignoreMissing: true }]]}
          skipHtml
          components={{
            a: ({ node: _node, href, children, ...rest }) => {
              const isExternal = href?.startsWith('http');
              return (
                <a
                  href={href}
                  target={isExternal ? '_blank' : undefined}
                  rel={isExternal ? 'noreferrer noopener' : undefined}
                  {...rest}
                >
                  {children}
                </a>
              );
            },
          }}
        >
          {rendered}
        </ReactMarkdown>
      ) : (
        <div className="flex items-center justify-center h-full text-retro-comment text-[15px] italic">
          Esta página ainda está em branco. Comece a escrever ao lado.
        </div>
      )}
    </div>
  );
}
