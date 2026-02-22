export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  folderId: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface NotesState {
  notes: Note[];
  folders: Folder[];
  currentNoteId: string | null;
  currentFolderId: string | null;
  searchQuery: string;
}
