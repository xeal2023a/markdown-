import { useMemo, useEffect, useState } from 'react';
import { marked, Renderer } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';
import { useNotes } from '../context/NotesContext';
import './Preview.css';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface PreviewProps {
  scrollRef?: React.RefObject<HTMLDivElement | null>;
  onScroll?: (position: number) => void;
}

// 创建自定义渲染器，禁用 codespan 的 HTML 转义
const createRenderer = () => {
  const renderer = new Renderer();
  renderer.codespan = ({ text }) => {
    // 不转义，直接返回
    return `<code>${text}</code>`;
  };
  return renderer;
};

export function Preview({ scrollRef, onScroll }: PreviewProps) {
  const { currentNote } = useNotes();
  const [toc, setToc] = useState<TocItem[]>([]);

  // Configure marked with highlight.js
  useEffect(() => {
    marked.use(
      markedHighlight({
        langPrefix: 'hljs language-',
        highlight(code, lang) {
          const language = hljs.getLanguage(lang) ? lang : 'plaintext';
          return hljs.highlight(code, { language }).value;
        },
      })
    );

    // 使用自定义渲染器
    marked.use({ renderer: createRenderer() });

    // Configure marked options
    marked.setOptions({
      gfm: true,
      breaks: true,
    });
  }, []);

  const html = useMemo(() => {
    if (!currentNote) return '';

    // Extract TOC before rendering
    const tokens = marked.lexer(currentNote.content);
    const tocItems: TocItem[] = [];

    tokens.forEach((token) => {
      if (token.type === 'heading') {
        const text = token.text;
        const id = text.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-');
        tocItems.push({
          id,
          text,
          level: token.depth,
        });
      }
    });

    setToc(tocItems);

    return marked.parse(currentNote.content) as string;
  }, [currentNote?.content]);

  const handleTocClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (!currentNote) {
    return (
      <div className="preview-empty">
        <p>预览区域</p>
      </div>
    );
  }

  return (
    <div className="preview">
      {toc.length > 0 && (
        <div className="toc">
          <div className="toc-title">目录</div>
          <ul className="toc-list">
            {toc.map((item) => (
              <li
                key={item.id}
                className={`toc-item toc-level-${item.level}`}
                onClick={() => handleTocClick(item.id)}
              >
                {item.text}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div
        className="preview-content"
        ref={scrollRef as React.RefObject<HTMLDivElement>}
        onScroll={(e) => onScroll?.((e.target as HTMLDivElement).scrollTop)}
      >
        <article
          className="markdown-body"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}
