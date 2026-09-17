import React, { useState, useEffect } from 'react';
import {
  Archive,
  ArrowLeft,
  RotateCcw,
  Trash2,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { db } from '../db/dexie';
import { restoreSong, hardDeleteSong, purgeExpiredSongs } from '../db/sync';
import type { Song } from '../types';

interface AdminTrashProps {
  onBack: () => void;
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export const AdminTrash: React.FC<AdminTrashProps> = ({ onBack }) => {
  const [deletedSongs, setDeletedSongs] = useState<Song[]>([]);

  const loadTrash = async () => {
    const items = await db.songs.filter((s) => s.isDeleted).toArray();
    setDeletedSongs(items.sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0)));
  };

  useEffect(() => {
    loadTrash();
  }, []);

  const calculateDaysRemaining = (deletedAt: number | null): number => {
    if (!deletedAt) return 30;
    const elapsed = Date.now() - deletedAt;
    const remainingMs = THIRTY_DAYS_MS - elapsed;
    return Math.max(0, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)));
  };

  const handleRestore = async (songId: string) => {
    await restoreSong(songId);
    await loadTrash();
  };

  const handlePermanentDelete = async (songId: string, title: string) => {
    if (
      window.confirm(
        `Tem certeza de que deseja EXCLUIR DEFINITIVAMENTE "${title}"? Esta ação não pode ser desfeita.`
      )
    ) {
      await hardDeleteSong(songId);
      await loadTrash();
    }
  };

  const handlePurgeNow = async () => {
    if (window.confirm('Executar limpeza automática de itens com mais de 30 dias na lixeira?')) {
      await purgeExpiredSongs();
      await loadTrash();
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-5 sm:py-7 space-y-5 animate-ui-fade">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-[var(--color-bg-card)] border border-[var(--color-border)]/20 shadow-sm transition-colors duration-150">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-[var(--color-bg-subtle)] hover:bg-[var(--color-bg-card)] border border-[var(--color-border)]/25 text-[var(--color-text-primary)] emil-press"
            title="Voltar à Administração"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Archive className="w-4 h-4 text-rose-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-rose-600 font-mono">
                Retenção Temporária (30 dias)
              </span>
            </div>
            <h1 className="text-2xl font-black text-[var(--color-text-primary)] mt-1">Lixeira de Cifras</h1>
            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
              Itens excluídos permanecem aqui por 30 dias antes da eliminação definitiva.
            </p>
          </div>
        </div>

        {deletedSongs.length > 0 && (
          <button
            onClick={handlePurgeNow}
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-rose-500/15 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-500/30 text-xs font-bold emil-press"
          >
            <Trash2 className="w-4 h-4" />
            <span>Limpar Vencidas</span>
          </button>
        )}
      </div>

      <div className="p-4 rounded-2xl bg-[#C08552]/10 border border-[#C08552]/25 flex items-center gap-3 text-xs text-[var(--color-text-primary)] shadow-sm">
        <AlertTriangle className="w-4 h-4 shrink-0 text-[#C08552]" />
        <span>
          Músicas na lixeira não aparecem nas buscas nem no índice A-Z.
        </span>
      </div>

      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)]/20 rounded-3xl overflow-hidden shadow-sm transition-colors duration-150">
        <div className="p-4 border-b border-[var(--color-border)]/15 flex items-center justify-between">
          <span className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
            Itens na Lixeira ({deletedSongs.length})
          </span>
        </div>

        <div className="divide-y divide-[var(--color-border)]/15">
          {deletedSongs.length === 0 ? (
            <div className="p-12 text-center text-[var(--color-text-secondary)] text-sm">
              A lixeira está vazia. Nenhuma música excluída temporariamente.
            </div>
          ) : (
            deletedSongs.map((song) => {
              const daysRemaining = calculateDaysRemaining(song.deletedAt);
              return (
                <div
                  key={song.id}
                  className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-[var(--color-bg-subtle)]/60 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-[var(--color-text-primary)] truncate line-through opacity-75">
                        {song.title}
                      </h3>
                      <span className="px-2 py-0.5 rounded-md bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)] font-mono text-[11px] border border-[var(--color-border)]/20">
                        Tom: {song.originalKey}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[var(--color-text-secondary)] mt-1">
                      {song.artist && <span>{song.artist}</span>}
                      <span className="flex items-center gap-1 text-[#C08552] font-semibold">
                        <Clock className="w-3 h-3" />
                        {daysRemaining > 0
                          ? `Exclusão definitiva em ${daysRemaining} ${
                              daysRemaining === 1 ? 'dia' : 'dias'
                            }`
                          : 'Expirada (pronta para purge)'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    <button
                      onClick={() => handleRestore(song.id)}
                      className="flex items-center gap-1 h-8 px-3 rounded-full bg-emerald-500/15 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-500/30 text-xs font-bold emil-press"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restaurar</span>
                    </button>
                    <button
                      onClick={() => handlePermanentDelete(song.id, song.title)}
                      className="flex items-center gap-1 h-8 px-3 rounded-full bg-rose-500/15 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-500/30 text-xs font-bold emil-press"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Excluir Agora</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
