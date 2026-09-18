export interface Song {
  id: string;
  title: string;
  artist?: string;
  bpm?: number;
  originalKey: string;
  content: string;
  format: 'chords-over-lyrics' | 'chordpro';
  createdAt: number;
  updatedAt: number;
  isDeleted: boolean;
  deletedAt: number | null;
}

export interface SetlistItem {
  songId: string;
  customKey: string;
  order: number;
}

export interface Setlist {
  id: string;
  name: string;
  items: SetlistItem[];
  isDefault?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface SetlistItemWithSong {
  songId: string;
  customKey: string;
  order: number;
  song: Song;
}

export interface QrSetlistPayload {
  v: 1;
  n: string;
  s: [string, string][];
}

export interface AppConfig {
  trashRetentionDays: number;
  theme: 'dark' | 'light';
  fontSize: number;
}
