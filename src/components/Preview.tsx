import { useMemo, useEffect, useState } from 'react';
import { marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';
import { useNotes } from '../context/NotesContext';
import './Preview.css';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function Preview() {
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
      <div className="preview-content">
        <article
          className="markdown-body"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}
