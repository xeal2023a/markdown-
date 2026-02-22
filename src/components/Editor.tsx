import { useState, useEffect, useCallback } from 'react';
import TextareaCodeEditor from '@uiw/react-textarea-code-editor';
import { useNotes } from '../context/NotesContext';
import { useDebounce } from '../hooks/useDebounce';
import './Editor.css';

interface EditorProps {
  scrollRef?: React.RefObject<HTMLDivElement | null>;
  onScroll?: (position: number) => void;
}

export function Editor({ scrollRef, onScroll }: EditorProps) {
  const { currentNote, dispatch } = useNotes();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const debouncedTitle = useDebounce(title, 500);
  const debouncedContent = useDebounce(content, 500);

  // Sync with current note
  useEffect(() => {
    if (currentNote) {
      setTitle(currentNote.title);
      setContent(currentNote.content);
    } else {
      setTitle('');
      setContent('');
    }
  }, [currentNote?.id]);

  // Auto-save on debounced value change
  useEffect(() => {
    if (currentNote && (debouncedTitle !== currentNote.title || debouncedContent !== currentNote.content)) {
      dispatch({
        type: 'UPDATE_NOTE',
        payload: {
          ...currentNote,
          title: debouncedTitle,
          content: debouncedContent,
        },
      });
    }
  }, [debouncedTitle, debouncedContent]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  const handleImageUpload = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !currentNote) return;

      // 限制图片大小为 1MB
      const MAX_SIZE = 1024 * 1024;
      if (file.size > MAX_SIZE) {
        alert('图片大小不能超过 1MB，请选择更小的图片');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const imageMarkdown = `\n![${file.name}](${base64})\n`;
        setContent(prev => prev + imageMarkdown);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }, [currentNote]);

  const handleCodeBlock = useCallback(() => {
    const codeBlock = `\n\`\`\`javascript\n// 在此输入代码\n\`\`\`\n`;
    setContent(prev => prev + codeBlock);
  }, []);

  const handleBold = useCallback(() => {
    const boldText = `\n**粗体文字**\n`;
    setContent(prev => prev + boldText);
  }, []);

  const handleColor = useCallback((color: string) => {
    const colorText = `\n<span style="color: ${color}">彩色文字</span>\n`;
    setContent(prev => prev + colorText);
    setColorPickerOpen(false);
  }, []);

  const [colorPickerOpen, setColorPickerOpen] = useState(false);

  if (!currentNote) {
    return (
      <div className="editor-empty">
        <p>选择或创建一篇笔记开始编辑</p>
      </div>
    );
  }

  return (
    <div className="editor">
      <div className="editor-header">
        <input
          type="text"
          className="title-input"
          placeholder="笔记标题"
          value={title}
          onChange={handleTitleChange}
        />
        <button className="image-btn" onClick={handleImageUpload} title="插入图片">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21,15 16,10 5,21"/>
          </svg>
        </button>
        <button className="image-btn" onClick={handleCodeBlock} title="插入代码块">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="16,18 22,12 16,6"/>
            <polyline points="8,6 2,12 8,18"/>
          </svg>
        </button>
        <button className="image-btn" onClick={handleBold} title="加粗">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
            <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
          </svg>
        </button>
      </div>
      <div className="editor-toolbar-row">
        <div className="color-picker">
          <button className="image-btn" onClick={() => setColorPickerOpen(!colorPickerOpen)} title="文字颜色">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v12"/>
              <path d="M8 6v0a4 4 0 0 1 8 0v0"/>
            </svg>
          </button>
          <div className={`color-dropdown ${colorPickerOpen ? 'show' : ''}`}>
            <button onClick={() => handleColor('#ff6b6b')} title="红色">
              <span style={{ color: '#ff6b6b', fontWeight: 'bold' }}>A</span>
            </button>
            <button onClick={() => handleColor('#ffd93d')} title="黄色">
              <span style={{ color: '#ffd93d', fontWeight: 'bold' }}>A</span>
            </button>
            <button onClick={() => handleColor('#6bcb77')} title="绿色">
              <span style={{ color: '#6bcb77', fontWeight: 'bold' }}>A</span>
            </button>
            <button onClick={() => handleColor('#4d96ff')} title="蓝色">
              <span style={{ color: '#4d96ff', fontWeight: 'bold' }}>A</span>
            </button>
          </div>
        </div>
      </div>
      <div
        className="editor-content"
        ref={scrollRef as React.RefObject<HTMLDivElement>}
        onScroll={(e) => onScroll?.((e.target as HTMLDivElement).scrollTop)}
      >
        <TextareaCodeEditor
          value={content}
          language="markdown"
          placeholder="使用 Markdown 编写内容..."
          onChange={handleContentChange}
          className="code-editor"
          style={{
            fontSize: 14,
            backgroundColor: 'var(--editor-bg)',
            color: 'var(--text-primary)',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          }}
          data-language="markdown"
        />
      </div>
    </div>
  );
}
