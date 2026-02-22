import { useState, useEffect, useCallback, useRef } from 'react';
import { NotesProvider } from './context/NotesContext';
import { Sidebar } from './components/Sidebar';
import { Editor } from './components/Editor';
import { Preview } from './components/Preview';
import './styles/global.css';
import 'highlight.js/styles/github.css';
import './App.css';

type Theme = 'light' | 'dark' | 'sepia';
type MarkdownStyle = 'standard' | 'github';

function App() {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('marknote_theme') as Theme) || 'light';
  });
  const [markdownStyle, setMarkdownStyle] = useState<MarkdownStyle>(() => {
    return (localStorage.getItem('marknote_markdown_style') as MarkdownStyle) || 'standard';
  });
  const [splitPosition, setSplitPosition] = useState<number>(() => {
    return parseFloat(localStorage.getItem('marknote_split_position') || '50');
  });
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('marknote_theme', theme);
  }, [theme]);

  useEffect(() => {
    document.body.className = markdownStyle === 'github' ? 'github-style' : '';
    localStorage.setItem('marknote_markdown_style', markdownStyle);
  }, [markdownStyle]);

  useEffect(() => {
    localStorage.setItem('marknote_split_position', splitPosition.toString());
  }, [splitPosition]);

  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newPosition = ((e.clientX - rect.left) / rect.width) * 100;
    setSplitPosition(Math.min(Math.max(newPosition, 20), 80));
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleExportPDF = () => {
    window.print();
  };

  const toggleTheme = () => {
    const themes: Theme[] = ['light', 'dark', 'sepia'];
    const currentIndex = themes.indexOf(theme);
    setTheme(themes[(currentIndex + 1) % themes.length]);
  };

  const themeLabels = {
    light: '浅色',
    dark: '深色',
    sepia: '护眼',
  };

  return (
    <NotesProvider>
      <div className="app">
        <Sidebar />
        <main className="main-content" ref={containerRef}>
          <div className="editor-panel" style={{ width: `${splitPosition}%` }}>
            <Editor />
          </div>
          <div
            className={`split-handle ${isDragging ? 'dragging' : ''}`}
            onMouseDown={handleMouseDown}
          />
          <div className="preview-panel" style={{ width: `${100 - splitPosition}%` }}>
            <div className="toolbar">
              <select
                className="style-select"
                value={markdownStyle}
                onChange={(e) => setMarkdownStyle(e.target.value as MarkdownStyle)}
              >
                <option value="standard">标准风格</option>
                <option value="github">GitHub 风格</option>
              </select>
              <button className="toolbar-btn" onClick={toggleTheme} title="切换主题">
                {themeLabels[theme]}
              </button>
              <button className="toolbar-btn" onClick={handleExportPDF} title="导出 PDF">
                导出 PDF
              </button>
            </div>
            <Preview />
          </div>
        </main>
      </div>
    </NotesProvider>
  );
}

export default App;
