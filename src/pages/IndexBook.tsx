import React, { useState, useEffect, useMemo } from "react";
import { Search, BookOpen, Star, X, Music } from "lucide-react";
import { db } from "../db/dexie";
import { useSetlists } from "../context/SetlistListsContext";
import type { Song } from "../types";

interface IndexBookProps {
  onOpenSong: (songId: string, fromTab: "index" | "setlists") => void;
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#".split("");

export const IndexBook: React.FC<IndexBookProps> = ({ onOpenSong }) => {
  const { isSongInActiveSetlist, toggleSongInActiveSetlist, activeSetlist, setlists, setActiveSetlistId } = useSetlists();
  const [songs, setSongs] = useState<Song[]>([]);
  const [query, setQuery] = useState("");
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);

  useEffect(() => {
    db.songs
      .filter((s) => !s.isDeleted)
      .toArray()
      .then((data) => {
        setSongs(data.sort((a, b) => a.title.localeCompare(b.title, "pt-BR")));
      });
  }, []);

  const filteredSongs = useMemo(() => {
    let result = songs;

    if (selectedLetter) {
      if (selectedLetter === "#") {
        result = result.filter((s) => /^[0-9]/.test(s.title));
      } else {
        result = result.filter((s) =>
          s.title.toUpperCase().startsWith(selectedLetter)
        );
      }
    }

    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter((s) => {
        const inTitle = s.title.toLowerCase().includes(q);
        const inArtist = s.artist?.toLowerCase().includes(q);
        const inLyrics = s.content.toLowerCase().includes(q);
        return inTitle || inArtist || inLyrics;
      });
    }

    return result;
  }, [songs, query, selectedLetter]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-5 sm:py-7 space-y-5 animate-ui-fade">
      {/* Header Card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[var(--color-accent)]/15 flex items-center justify-center text-[var(--color-accent)]">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-accent)] font-mono">
              Índice Geral do Hinário
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--color-text-primary)] tracking-tight leading-tight">
            Todas as Músicas (A-Z)
          </h1>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
            {songs.length} louvores disponíveis 100% offline. Toque para abrir a cifra.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
          {setlists.length > 0 && (
            <div className="h-9 flex items-center gap-1.5 bg-[var(--color-bg-subtle)] border border-[var(--color-border-subtle)] rounded-full px-3 text-xs text-[var(--color-text-secondary)]">
              <span className="text-[11px] font-semibold">Lista:</span>
              <select
                value={activeSetlist?.id || ""}
                onChange={(e) => setActiveSetlistId(e.target.value)}
                className="bg-transparent text-[var(--color-accent)] font-bold focus:outline-none cursor-pointer truncate max-w-[150px] leading-none"
              >
                {setlists.map((s) => (
                  <option key={s.id} value={s.id} className="bg-[var(--color-bg-page)] text-[var(--color-text-primary)]">
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="w-full sm:w-72 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)] pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (selectedLetter) setSelectedLetter(null);
              }}
              placeholder="Buscar título, artista ou letra..."
              className="w-full h-9 pl-10 pr-9 bg-[var(--color-bg-subtle)] border border-[var(--color-border-subtle)] rounded-full text-[16px] sm:text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/15"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] p-1 emil-press rounded-full"
                aria-label="Limpar pesquisa"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Alphabet Scrubber */}
      <div className="flex items-center gap-1 horizontal-touch-scroll pb-1.5 scrollbar-none">
        <button
          onClick={() => setSelectedLetter(null)}
          className={`h-8 px-3.5 flex items-center justify-center rounded-full text-xs font-bold shrink-0 emil-press ${
            selectedLetter === null
              ? "bg-[var(--color-accent)] text-[var(--color-accent-contrast)] shadow-sm font-bold"
              : "bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border-subtle)]"
          }`}
        >
          Todas
        </button>
        {ALPHABET.map((letter) => (
          <button
            key={letter}
            onClick={() => {
              setSelectedLetter(letter === selectedLetter ? null : letter);
              setQuery("");
            }}
            className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold shrink-0 emil-press ${
              selectedLetter === letter
                ? "bg-[var(--color-accent)] text-[var(--color-accent-contrast)] shadow-sm font-bold"
                : "bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border-subtle)]"
            }`}
          >
            {letter}
          </button>
        ))}
      </div>

      {/* Song List */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-3xl divide-y divide-[var(--color-border-subtle)] overflow-hidden shadow-sm">
        {filteredSongs.length === 0 ? (
          <div className="p-12 text-center text-[var(--color-text-secondary)] text-sm space-y-2">
            <Music className="w-8 h-8 mx-auto opacity-40 text-[var(--color-accent)]" />
            <p>Nenhuma música encontrada com os termos buscados.</p>
          </div>
        ) : (
          filteredSongs.map((song) => {
            const starred = isSongInActiveSetlist(song.id);
            return (
              <div
                key={song.id}
                className="flex items-center justify-between p-3 sm:p-3.5 hover:bg-[var(--color-bg-subtle)] emil-press group cursor-pointer"
                onClick={() => onOpenSong(song.id, "index")}
              >
                <div className="min-w-0 pr-4 flex-1 flex flex-col justify-center">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm sm:text-base font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] truncate leading-tight">
                      {song.title}
                    </h2>
                    <span className="shrink-0 px-2 py-0.5 rounded-full bg-[var(--color-accent)]/15 border border-[var(--color-accent)]/30 text-[var(--color-accent)] font-mono tnum font-bold text-[11px] leading-none">
                      {song.originalKey}
                    </span>
                  </div>
                  {song.artist && (
                    <p className="text-xs text-[var(--color-text-secondary)] truncate leading-none mt-0.5">{song.artist}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSongInActiveSetlist(song);
                    }}
                    title={starred ? `Remover de ${activeSetlist?.name}` : `Adicionar em ${activeSetlist?.name}`}
                    className={`w-8 h-8 flex items-center justify-center rounded-full border emil-press ${
                      starred
                        ? "bg-[var(--color-accent)] text-[var(--color-accent-contrast)] border-[var(--color-accent)] shadow-sm"
                        : "bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] border border-[var(--color-border-subtle)] hover:bg-[var(--color-bg-card)]"
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 shrink-0 ${starred ? "fill-current" : ""}`} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
