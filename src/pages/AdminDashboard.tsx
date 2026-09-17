import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  Eye,
  RefreshCw,
  Archive,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react';
import { db } from '../db/dexie';
import { syncSongsWithRemote, softDeleteSong, saveSong } from '../db/sync';
import { COMMON_KEYS, extractCifraClubKey, cleanCifraClubArtifacts } from '../services/chordEngine';
import { ChordViewer } from '../components/ChordViewer';
import type { Song } from '../types';

interface AdminDashboardProps {
  onNavigateToTrash: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigateToTrash
}) => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [originalKey, setOriginalKey] = useState('C');
  const [format, setFormat] = useState<'chords-over-lyrics' | 'chordpro'>('chords-over-lyrics');
  const [content, setContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [trashCount, setTrashCount] = useState(0);

  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadSongs = async () => {
    const active = await db.songs.filter((s) => !s.isDeleted).toArray();
    setSongs(active.sort((a, b) => a.title.localeCompare(b.title, 'pt-BR')));

    const deleted = await db.songs.filter((s) => s.isDeleted).count();
    setTrashCount(deleted);
  };

  useEffect(() => {
    loadSongs();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setTitle('');
    setArtist('');
    setOriginalKey('C');
    setFormat('chords-over-lyrics');
    setContent('');
    setShowPreview(false);
    setIsEditing(true);
  };

  const handleOpenEdit = (song: Song) => {
    setEditingId(song.id);
    setTitle(song.title);
    setArtist(song.artist || '');
    setOriginalKey(song.originalKey);
    setFormat(song.format);
    setContent(song.content);
    setShowPreview(false);
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert('Preencha título e conteúdo da cifra.');
      return;
    }

    const detectedKey = extractCifraClubKey(content);
    const keyToSave = (detectedKey && COMMON_KEYS.includes(detectedKey)) ? detectedKey : originalKey;
    const sanitizedContent = cleanCifraClubArtifacts(content);

    const songData: Song = {
      id: editingId || `song_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title: title.trim(),
      artist: artist.trim() || undefined,
      originalKey: keyToSave,
      format,
      content: sanitizedContent,
      createdAt: editingId ? (songs.find((s) => s.id === editingId)?.createdAt || Date.now()) : Date.now(),
      updatedAt: Date.now(),
      isDeleted: false,
      deletedAt: null
    };

    await saveSong(songData);
    setIsEditing(false);
    await loadSongs();
  };

  const handleDelete = async (songId: string, songTitle: string) => {
    if (
      window.confirm(
        `Deseja mover "${songTitle}" para a lixeira? Ela ficará disponível para restauração por 30 dias.`
      )
    ) {
      await softDeleteSong(songId);
      await loadSongs();
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      await syncSongsWithRemote();
      setSyncStatus('Sincronização com a nuvem concluída com sucesso!');
      await loadSongs();
    } catch (err: any) {
      setSyncStatus(`Erro ao sincronizar: ${err?.message || 'Verifique conexão'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const extractKeyFromText = (text: string): string => {
    const match = text.match(/tom:\s*([A-G][#b]?m?)/i) || text.match(/\bkey:\s*([A-G][#b]?m?)/i);
    if (match && match[1]) {
      const clean = match[1].toUpperCase();
      if (COMMON_KEYS.includes(clean)) return clean;
    }
    return 'C';
  };

  const handleBatchTxtUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsImporting(true);
    setImportStatus(`Lendo ${files.length} arquivos...`);

    const newSongs: Song[] = [];
    const now = Date.now();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const text = await file.text();
        const rawName = file.name.replace(/\.[^/.]+$/, '').replace(/^[0-9]+[-_\s]*/, '').trim();
        const songTitle = rawName || `Música ${i + 1}`;
        const key = extractKeyFromText(text);

        newSongs.push({
          id: `song_${now}_${i}_${Math.random().toString(36).slice(2, 6)}`,
          title: songTitle,
          originalKey: key,
          format: text.includes('[') && text.includes(']') ? 'chordpro' : 'chords-over-lyrics',
          content: text.trim(),
          createdAt: now,
          updatedAt: now,
          isDeleted: false,
          deletedAt: null
        });
      } catch (err) {
        console.warn(`Erro ao ler arquivo ${file.name}:`, err);
      }
    }

    if (newSongs.length > 0) {
      await db.songs.bulkPut(newSongs);
      await loadSongs();
      setImportStatus(`Sucesso! ${newSongs.length} músicas importadas para o hinário offline.`);
    } else {
      setImportStatus('Nenhum arquivo TXT processado.');
    }

    setIsImporting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-5 sm:py-7 space-y-5 animate-ui-fade">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-[var(--color-bg-card)] border border-[var(--color-border)]/20 shadow-sm transition-colors duration-150">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#C08552]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#C08552] font-mono">
              Gestão & Importação
            </span>
          </div>
          <h1 className="text-2xl font-black text-[var(--color-text-primary)] mt-1">Acervo do Hinário</h1>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
            Importe os 395 TXTs da pasta da igreja de uma só vez, edite cifras ou sincronize.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".txt,.chordpro,.cifra"
            onChange={handleBatchTxtUpload}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] active:scale-95 text-[var(--color-accent-contrast)] text-xs font-bold shadow-md shadow-[#C08552]/20 disabled:opacity-50 emil-press"
            title="Importar múltiplos arquivos TXT"
          >
            <Upload className="w-4 h-4" />
            <span>{isImporting ? 'Importando...' : 'Importar TXTs em Lote'}</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-[var(--color-bg-subtle)] border border-[var(--color-border)]/25 hover:bg-[var(--color-bg-card)] active:scale-95 text-[var(--color-text-primary)] text-xs font-bold emil-press shadow-sm"
          >
            <Plus className="w-4 h-4 text-[#C08552]" />
            <span>Nova Música</span>
          </button>

          <button
            onClick={onNavigateToTrash}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-[var(--color-bg-subtle)] border border-[var(--color-border)]/25 hover:bg-[var(--color-bg-card)] active:scale-95 text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] emil-press"
            title="Lixeira"
          >
            <Archive className="w-4 h-4 text-rose-600" />
            {trashCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-700 text-[10px] font-mono font-bold">
                {trashCount}
              </span>
            )}
          </button>

          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-[var(--color-bg-subtle)] border border-[var(--color-border)]/25 hover:bg-[var(--color-bg-card)] active:scale-95 text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-50 emil-press"
            title="Sincronizar com a nuvem"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-[#C08552]' : ''}`} />
          </button>
        </div>
      </div>

      {importStatus && (
        <div className="p-4 rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border)]/25 flex items-center justify-between gap-3 text-xs text-[var(--color-text-primary)] animate-ui-fade shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{importStatus}</span>
          </div>
          <button onClick={() => setImportStatus(null)} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {syncStatus && (
        <div className="p-4 rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border)]/25 flex items-center justify-between gap-3 text-xs text-[var(--color-text-primary)] animate-ui-fade shadow-sm">
          <div className="flex items-center gap-2">
            {syncStatus.includes('Erro') ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{syncStatus}</span>
          </div>
          <button onClick={() => setSyncStatus(null)} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {isEditing && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setIsEditing(false)}>
          <div className="w-full max-w-2xl max-h-[calc(100dvh-2rem)] bg-[var(--color-bg-card)] border border-[var(--color-border)]/25 rounded-3xl p-6 shadow-2xl overflow-y-auto sheet-scroll space-y-6 animate-modal-pop my-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[var(--color-border)]/20 pb-4">
              <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
                {editingId ? 'Editar Cifra / Música' : 'Cadastrar Nova Música'}
              </h2>
              <button
                onClick={() => setIsEditing(false)}
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
                    Título da Música *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Bondade de Deus"
                    className="w-full px-3.5 py-2.5 bg-[var(--color-bg-subtle)] border border-[var(--color-border)]/30 rounded-2xl text-base sm:text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
                    Artista / Ministério
                  </label>
                  <input
                    type="text"
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    placeholder="Ex: Isaías Saad"
                    className="w-full px-3.5 py-2.5 bg-[var(--color-bg-subtle)] border border-[var(--color-border)]/30 rounded-2xl text-base sm:text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
                    Tom Original *
                  </label>
                  <select
                    value={originalKey}
                    onChange={(e) => setOriginalKey(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[var(--color-bg-subtle)] border border-[var(--color-border)]/30 rounded-2xl text-base sm:text-sm text-[var(--color-text-primary)] font-mono font-bold focus:outline-none focus:border-[var(--color-accent)]"
                  >
                    {COMMON_KEYS.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
                    Formato de Cifra
                  </label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-[var(--color-bg-subtle)] border border-[var(--color-border)]/30 rounded-2xl text-base sm:text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)]"
                  >
                    <option value="chords-over-lyrics">
                      Duas Linhas (Acordes acima da letra)
                    </option>
                    <option value="chordpro">ChordPro ([C]Acordes entre colchetes)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
                    Conteúdo da Cifra *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex items-center gap-1 text-xs font-semibold text-[#C08552] hover:text-[var(--color-text-primary)]"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{showPreview ? 'Ocultar Preview' : 'Visualizar Preview'}</span>
                  </button>
                </div>

                <textarea
                  rows={10}
                  required
                  value={content}
                  onChange={(e) => {
                    let val = e.target.value;
                    if (val.includes('">')) {
                      val = cleanCifraClubArtifacts(val);
                    }
                    setContent(val);
                    const detected = extractCifraClubKey(val);
                    if (detected && COMMON_KEYS.includes(detected)) {
                      setOriginalKey(detected);
                    }
                  }}
                  placeholder="Cole aqui a cifra exatamente como no Word ou TXT..."
                  className="w-full px-3.5 py-3 bg-[var(--color-bg-subtle)] border border-[var(--color-border)]/30 rounded-2xl text-base sm:text-sm font-mono text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-accent)] whitespace-pre"
                />
              </div>

              {showPreview && content && (
                <div className="p-4 rounded-2xl bg-[var(--color-bg-subtle)] border border-[var(--color-border)]/25 space-y-2">
                  <span className="text-[11px] font-bold text-[#C08552] uppercase tracking-wider font-mono">
                    Pré-visualização:
                  </span>
                  <ChordViewer
                    song={{
                      id: 'preview',
                      title,
                      artist,
                      originalKey,
                      format,
                      content,
                      createdAt: 0,
                      updatedAt: 0,
                      isDeleted: false,
                      deletedAt: null
                    }}
                    currentKey={originalKey}
                    fontSize={16}
                  />
                </div>
              )}

              <div className="pt-4 border-t border-[var(--color-border)]/20 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="h-9 px-3.5 rounded-full bg-[var(--color-bg-subtle)] hover:bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] text-xs font-semibold emil-press"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 h-9 px-4 rounded-full bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-accent-contrast)] text-xs font-bold shadow-md shadow-[var(--color-accent)]/25 emil-press"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Música</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)]/20 rounded-3xl overflow-hidden shadow-sm transition-colors duration-150">
        <div className="p-4 border-b border-[var(--color-border)]/15 flex items-center justify-between">
          <span className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
            Repertório Ativo ({songs.length})
          </span>
        </div>

        <div className="divide-y divide-[var(--color-border)]/15 max-h-[60vh] overflow-y-auto sheet-scroll">
          {songs.length === 0 ? (
            <div className="p-12 text-center text-[var(--color-text-secondary)] text-sm">
              Nenhuma música cadastrada no momento. Clique em "Importar TXTs em Lote" para carregar a pasta da igreja.
            </div>
          ) : (
            songs.map((song) => (
              <div
                key={song.id}
                className="p-3.5 sm:p-4 flex items-center justify-between gap-4 hover:bg-[var(--color-bg-subtle)]/60 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[var(--color-text-primary)] truncate">{song.title}</h3>
                    <span className="px-2 py-0.5 rounded-md bg-[var(--color-accent)]/15 border border-[#C08552]/30 text-[#C08552] font-mono font-bold text-[11px]">
                      {song.originalKey}
                    </span>
                  </div>
                  {song.artist && (
                    <p className="text-xs text-[var(--color-text-secondary)] truncate mt-0.5">{song.artist}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleOpenEdit(song)}
                    title="Editar cifra"
                    className="p-2 rounded-2xl bg-[var(--color-bg-subtle)] hover:bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] emil-press"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(song.id, song.title)}
                    title="Mover para lixeira"
                    className="p-2 rounded-2xl bg-[var(--color-bg-subtle)] hover:bg-rose-500/20 text-[var(--color-text-secondary)] hover:text-rose-600 emil-press"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
