import React, { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import type { Note, NotesState, Folder } from '../types';

type NotesAction =
  | { type: 'SET_NOTES'; payload: Note[] }
  | { type: 'ADD_NOTE'; payload: Note }
  | { type: 'UPDATE_NOTE'; payload: Note }
  | { type: 'DELETE_NOTE'; payload: string }
  | { type: 'SET_CURRENT_NOTE'; payload: string | null }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_FOLDERS'; payload: Folder[] }
  | { type: 'ADD_FOLDER'; payload: Folder }
  | { type: 'UPDATE_FOLDER'; payload: Folder }
  | { type: 'DELETE_FOLDER'; payload: string }
  | { type: 'SET_CURRENT_FOLDER'; payload: string | null }
  | { type: 'MOVE_NOTE_TO_FOLDER'; payload: { noteId: string; folderId: string | null } };

const initialState: NotesState = {
  notes: [],
  folders: [],
  currentNoteId: null,
  currentFolderId: null,
  searchQuery: '',
};

function notesReducer(state: NotesState, action: NotesAction): NotesState {
  switch (action.type) {
    case 'SET_NOTES':
      return { ...state, notes: action.payload };
    case 'ADD_NOTE':
      return { ...state, notes: [action.payload, ...state.notes], currentNoteId: action.payload.id };
    case 'UPDATE_NOTE':
      return {
        ...state,
        notes: state.notes.map(note =>
          note.id === action.payload.id ? { ...action.payload, updatedAt: Date.now() } : note
        ),
      };
    case 'DELETE_NOTE':
      const newNotes = state.notes.filter(note => note.id !== action.payload);
      return {
        ...state,
        notes: newNotes,
        currentNoteId: state.currentNoteId === action.payload
          ? (newNotes.length > 0 ? newNotes[0].id : null)
          : state.currentNoteId,
      };
    case 'SET_CURRENT_NOTE':
      return { ...state, currentNoteId: action.payload };
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    case 'SET_FOLDERS':
      return { ...state, folders: action.payload };
    case 'ADD_FOLDER':
      return { ...state, folders: [...state.folders, action.payload] };
    case 'UPDATE_FOLDER':
      return {
        ...state,
        folders: state.folders.map(folder =>
          folder.id === action.payload.id ? action.payload : folder
        ),
      };
    case 'DELETE_FOLDER': {
      const folderIdToDelete = action.payload;
      const foldersToDelete = new Set<string>();
      const collectFolderAndChildren = (fid: string) => {
        foldersToDelete.add(fid);
        state.folders.forEach(f => {
          if (f.parentId === fid) collectFolderAndChildren(f.id);
        });
      };
      collectFolderAndChildren(folderIdToDelete);
      const newFolders = state.folders.filter(f => !foldersToDelete.has(f.id));
      const notesInDeletedFolders = state.notes.map(note =>
        foldersToDelete.has(note.folderId || '') ? { ...note, folderId: null } : note
      );
      return {
        ...state,
        folders: newFolders,
        notes: notesInDeletedFolders,
        currentFolderId: foldersToDelete.has(state.currentFolderId || '') ? null : state.currentFolderId,
      };
    }
    case 'SET_CURRENT_FOLDER':
      return { ...state, currentFolderId: action.payload };
    case 'MOVE_NOTE_TO_FOLDER':
      return {
        ...state,
        notes: state.notes.map(note =>
          note.id === action.payload.noteId ? { ...note, folderId: action.payload.folderId } : note
        ),
      };
    default:
      return state;
  }
}

interface NotesContextType {
  state: NotesState;
  dispatch: React.Dispatch<NotesAction>;
  currentNote: Note | null;
  filteredNotes: Note[];
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

const STORAGE_KEY = 'marknote_notes';
const FOLDERS_KEY = 'marknote_folders';

export function NotesProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(notesReducer, initialState);

  // Load notes and folders from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const notes: Note[] = JSON.parse(stored);
        dispatch({ type: 'SET_NOTES', payload: notes });
        if (notes.length > 0) {
          dispatch({ type: 'SET_CURRENT_NOTE', payload: notes[0].id });
        }
      }
      const storedFolders = localStorage.getItem(FOLDERS_KEY);
      if (storedFolders) {
        const folders: Folder[] = JSON.parse(storedFolders);
        dispatch({ type: 'SET_FOLDERS', payload: folders });
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }, []);

  // Save notes to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.notes));
    } catch (error) {
      console.error('Error saving notes:', error);
    }
  }, [state.notes]);

  // Save folders to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(FOLDERS_KEY, JSON.stringify(state.folders));
    } catch (error) {
      console.error('Error saving folders:', error);
    }
  }, [state.folders]);

  const currentNote = state.notes.find(note => note.id === state.currentNoteId) || null;

  const filteredNotes = state.notes
    .filter(note => {
      // Filter by current folder if set
      if (state.currentFolderId !== null && note.folderId !== state.currentFolderId) {
        return false;
      }
      // Filter by search query
      if (state.searchQuery !== '' &&
          !note.title.toLowerCase().includes(state.searchQuery.toLowerCase()) &&
          !note.content.toLowerCase().includes(state.searchQuery.toLowerCase())) {
        return false;
      }
      return true;
    })
    .sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <NotesContext.Provider
      value={{
        state,
        dispatch,
        currentNote,
        filteredNotes,
      }}
    >
      {children}
    </NotesContext.Provider>
  );
}

export function useNotes() {
  const context = useContext(NotesContext);
  if (context === undefined) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
}
