import { useState, useEffect } from 'react';
import { useNotes } from '../context/NotesContext';
import type { Note, Folder } from '../types';
import './Sidebar.css';

export function Sidebar() {
  const { state, dispatch, filteredNotes } = useNotes();
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('marknote_sidebar_collapsed') === 'true';
  });
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; type: 'folder' | 'note'; id: string } | null>(null);

  useEffect(() => {
    localStorage.setItem('marknote_sidebar_collapsed', String(collapsed));
  }, [collapsed]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleToggle = () => {
    setCollapsed(!collapsed);
  };

  const handleCreateNote = () => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: '无标题笔记',
      content: '',
      folderId: state.currentFolderId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    dispatch({ type: 'ADD_NOTE', payload: newNote });
  };

  const handleDeleteNote = (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    if (confirm('确定要删除这篇笔记吗？')) {
      dispatch({ type: 'DELETE_NOTE', payload: noteId });
    }
  };

  const handleSelectNote = (noteId: string) => {
    dispatch({ type: 'SET_CURRENT_NOTE', payload: noteId });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: e.target.value });
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    const newFolder: Folder = {
      id: crypto.randomUUID(),
      name: newFolderName.trim(),
      parentId: state.currentFolderId,
      createdAt: Date.now(),
    };
    dispatch({ type: 'ADD_FOLDER', payload: newFolder });
    setNewFolderName('');
    setShowNewFolderInput(false);
  };

  const handleToggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleSelectFolder = (folderId: string | null) => {
    dispatch({ type: 'SET_CURRENT_FOLDER', payload: folderId });
  };

  const handleRenameFolder = (folderId: string) => {
    const folder = state.folders.find(f => f.id === folderId);
    if (!folder) return;
    dispatch({ type: 'UPDATE_FOLDER', payload: { ...folder, name: editingFolderName } });
    setEditingFolderId(null);
    setEditingFolderName('');
  };

  const handleDeleteFolder = (e: React.MouseEvent, folderId: string) => {
    e.stopPropagation();
    if (confirm('确定要删除这个文件夹吗？其中的笔记将移动到根目录。')) {
      dispatch({ type: 'DELETE_FOLDER', payload: folderId });
    }
  };

  const handleContextMenu = (e: React.MouseEvent, type: 'folder' | 'note', id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, type, id });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Build folder tree structure
  const getChildFolders = (parentId: string | null): Folder[] => {
    return state.folders
      .filter(f => f.parentId === parentId)
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  const renderFolderTree = (parentId: string | null, depth: number = 0) => {
    const childFolders = getChildFolders(parentId);
    return childFolders.map(folder => (
      <div key={folder.id} className="folder-tree-item">
        <div
          className={`folder-item ${state.currentFolderId === folder.id ? 'active' : ''}`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => handleSelectFolder(folder.id)}
          onContextMenu={(e) => handleContextMenu(e, 'folder', folder.id)}
        >
          <span
            className="folder-toggle"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleFolder(folder.id);
            }}
          >
            {getChildFolders(folder.id).length > 0 && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points={expandedFolders.has(folder.id) ? "6,9 12,15 18,9" : "9,6 15,12 9,18"} />
              </svg>
            )}
          </span>
          <svg className="folder-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
          </svg>
          {editingFolderId === folder.id ? (
            <input
              type="text"
              className="folder-name-input"
              value={editingFolderName}
              onChange={(e) => setEditingFolderName(e.target.value)}
              onBlur={() => handleRenameFolder(folder.id)}
              onKeyDown={(e) => e.key === 'Enter' && handleRenameFolder(folder.id)}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="folder-name">{folder.name}</span>
          )}
        </div>
        {expandedFolders.has(folder.id) && renderFolderTree(folder.id, depth + 1)}
      </div>
    ));
  };

  return (
    <>
      {collapsed && (
        <button className="sidebar-expand-btn" onClick={handleToggle} title="显示侧边栏">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9,18 15,12 9,6"/>
          </svg>
        </button>
      )}
      <aside className={`sidebar ${collapsed ? 'hidden' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-title-row">
            <h1 className="app-title">MarkNote</h1>
            <button className="sidebar-collapse-btn" onClick={handleToggle} title="隐藏侧边栏">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15,18 9,12 15,6"/>
              </svg>
            </button>
          </div>
          <input
            type="text"
            className="search-input"
            placeholder="搜索笔记..."
            value={state.searchQuery}
            onChange={handleSearchChange}
          />
        </div>

        {/* Folder Section */}
        <div className="folder-section">
          <div className="folder-section-header">
            <span>文件夹</span>
            <button
              className="folder-action-btn"
              onClick={() => setShowNewFolderInput(true)}
              title="新建文件夹"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          </div>

          {/* New Folder Input */}
          {showNewFolderInput && (
            <div className="new-folder-input-wrapper">
              <input
                type="text"
                className="new-folder-input"
                placeholder="文件夹名称"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateFolder();
                  if (e.key === 'Escape') {
                    setShowNewFolderInput(false);
                    setNewFolderName('');
                  }
                }}
                autoFocus
              />
              <button className="new-folder-confirm" onClick={handleCreateFolder}>✓</button>
              <button className="new-folder-cancel" onClick={() => {
                setShowNewFolderInput(false);
                setNewFolderName('');
              }}>×</button>
            </div>
          )}

          {/* All Notes / Root */}
          <div
            className={`folder-item ${state.currentFolderId === null ? 'active' : ''}`}
            onClick={() => handleSelectFolder(null)}
          >
            <svg className="folder-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
            <span className="folder-name">全部笔记</span>
          </div>

          {/* Folder Tree */}
          {renderFolderTree(null)}
        </div>

        <div className="notes-list">
          {filteredNotes.length === 0 ? (
            <div className="no-notes">暂无笔记</div>
          ) : (
            filteredNotes.map((note) => (
              <div
                key={note.id}
                className={`note-item ${state.currentNoteId === note.id ? 'active' : ''}`}
                onClick={() => handleSelectNote(note.id)}
                onContextMenu={(e) => handleContextMenu(e, 'note', note.id)}
              >
                <div className="note-item-content">
                  <div className="note-title">{note.title || '无标题笔记'}</div>
                  <div className="note-date">{formatDate(note.updatedAt)}</div>
                </div>
                <button
                  className="delete-btn"
                  onClick={(e) => handleDeleteNote(e, note.id)}
                  title="删除笔记"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
        <button className="new-note-btn" onClick={handleCreateNote}>
          + 新建笔记
        </button>

        {/* Context Menu */}
        {contextMenu && (
          <div
            className="context-menu"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            {contextMenu.type === 'folder' && (
              <>
                <div
                  className="context-menu-item"
                  onClick={() => {
                    setEditingFolderId(contextMenu.id);
                    const folder = state.folders.find(f => f.id === contextMenu.id);
                    if (folder) setEditingFolderName(folder.name);
                    setContextMenu(null);
                  }}
                >
                  重命名
                </div>
                <div
                  className="context-menu-item danger"
                  onClick={(e) => {
                    handleDeleteFolder(e, contextMenu.id);
                    setContextMenu(null);
                  }}
                >
                  删除
                </div>
              </>
            )}
            {contextMenu.type === 'note' && (
              <>
                {state.folders.length > 0 && (
                  <div className="context-menu-submenu">
                    移动到...
                    <div className="submenu">
                      <div
                        className="context-menu-item"
                        onClick={() => {
                          dispatch({ type: 'MOVE_NOTE_TO_FOLDER', payload: { noteId: contextMenu.id, folderId: null } });
                          setContextMenu(null);
                        }}
                      >
                        根目录
                      </div>
                      {state.folders.map(folder => (
                        <div
                          key={folder.id}
                          className="context-menu-item"
                          onClick={() => {
                            dispatch({ type: 'MOVE_NOTE_TO_FOLDER', payload: { noteId: contextMenu.id, folderId: folder.id } });
                            setContextMenu(null);
                          }}
                        >
                          {folder.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div
                  className="context-menu-item danger"
                  onClick={(e) => {
                    handleDeleteNote(e, contextMenu.id);
                    setContextMenu(null);
                  }}
                >
                  删除
                </div>
              </>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
