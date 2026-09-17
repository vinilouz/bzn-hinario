import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowLeft,
  Star,
  Columns2,
  AlignLeft,
  Music2,
  Type,
  Sun,
  Moon
} from "lucide-react";
import { useSetlists } from "../context/SetlistListsContext";
import { useTheme } from "../context/ThemeContext";
import { db } from "../db/dexie";
import { transposeKeyName } from "../services/chordEngine";
import { ChordViewer } from "../components/ChordViewer";
import { BottomNavBar } from "../components/BottomNavBar";
import { useWakeLock } from "../hooks/useWakeLock";
import type { Song } from "../types";

interface PerformanceProps {
  initialSongId: string;
  initialSlotIndex?: number;
  sourceTab: "index" | "setlists";
  onExit: () => void;
}

export const Performance: React.FC<PerformanceProps> = ({
  initialSongId,
  initialSlotIndex = 0,
  sourceTab,
  onExit
}) => {
  const {
    activeItemsWithSongs,
    isSongInActiveSetlist,
    toggleSongInActiveSetlist,
    updateItemKey,
    activeSetlist
  } = useSetlists();
  const { theme, toggleTheme } = useTheme();
  useWakeLock(true);

  const [currentIndex, setCurrentIndex] = useState<number>(initialSlotIndex);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [currentKey, setCurrentKey] = useState<string>("C");
  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = localStorage.getItem("hinario_font_size");
    return saved ? Number(saved) : 18;
  });
  const [hideChords, setHideChords] = useState<boolean>(() => {
    return localStorage.getItem("hinario_hide_chords") === "true";
  });
  const [twoColumns, setTwoColumns] = useState<boolean>(() => {
    return localStorage.getItem("hinario_two_columns") === "true";
  });
  const [isAutoScrolling, setIsAutoScrolling] = useState<boolean>(false);
  const [scrollSpeed, setScrollSpeed] = useState<number>(() => {
    const saved = localStorage.getItem("hinario_scroll_speed");
    return saved ? Number(saved) : 2;
  });

  const scrollRafRef = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  useEffect(() => {
    if (sourceTab === "setlists" && activeItemsWithSongs.length > 0 && activeItemsWithSongs[currentIndex]) {
      const item = activeItemsWithSongs[currentIndex];
      setCurrentSong(item.song);
      setCurrentKey(item.customKey || item.song.originalKey);
      return;
    }

    db.songs.get(initialSongId).then((song) => {
      if (song) {
        setCurrentSong(song);
        setCurrentKey(song.originalKey);
      }
    });
  }, [initialSongId, currentIndex, sourceTab, activeItemsWithSongs]);

  const handleFontSizeChange = (delta: number) => {
    setFontSize((prev) => {
      const updated = Math.min(34, Math.max(12, prev + delta));
      localStorage.setItem("hinario_font_size", String(updated));
      return updated;
    });
  };

  const toggleHideChords = () => {
    setHideChords((prev) => {
      const next = !prev;
      localStorage.setItem("hinario_hide_chords", String(next));
      return next;
    });
  };

  const toggleTwoColumns = () => {
    setTwoColumns((prev) => {
      const next = !prev;
      localStorage.setItem("hinario_two_columns", String(next));
      return next;
    });
  };

  const handleKeyChange = (newKey: string) => {
    setCurrentKey(newKey);
    if (sourceTab === "setlists" && currentSong) {
      updateItemKey(currentSong.id, newKey);
    }
  };

  const handleStepKey = (semitones: number) => {
    setCurrentKey((prev) => {
      const nextKey = transposeKeyName(prev, semitones);
      if (sourceTab === "setlists" && currentSong) {
        updateItemKey(currentSong.id, nextKey);
      }
      return nextKey;
    });
  };

  const handleNext = useCallback(() => {
    if (sourceTab === "setlists" && currentIndex < activeItemsWithSongs.length - 1) {
      setIsAutoScrolling(false);
      setCurrentIndex((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [sourceTab, currentIndex, activeItemsWithSongs.length]);

  const handlePrev = useCallback(() => {
    if (sourceTab === "setlists" && currentIndex > 0) {
      setIsAutoScrolling(false);
      setCurrentIndex((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [sourceTab, currentIndex]);

  const toggleAutoScroll = () => {
    setIsAutoScrolling((prev) => !prev);
  };

  const handleChangeScrollSpeed = (delta: number) => {
    setScrollSpeed((prev) => {
      let next = prev + delta;
      if (next > 4) next = 1;
      if (next < 1) next = 4;
      localStorage.setItem("hinario_scroll_speed", String(next));
      return next;
    });
  };

  useEffect(() => {
    if (!isAutoScrolling) {
      if (scrollRafRef.current) {
        cancelAnimationFrame(scrollRafRef.current);
        scrollRafRef.current = null;
      }
      return;
    }

    let lastTime = performance.now();
    const step = (now: number) => {
      const elapsed = now - lastTime;
      lastTime = now;

      const pxPerSec = 12 + scrollSpeed * 15;
      const deltaPx = (pxPerSec * elapsed) / 1000;

      window.scrollBy({ top: deltaPx, behavior: "auto" });

      const reachedBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 6;
      if (reachedBottom) {
        setIsAutoScrolling(false);
        return;
      }

      scrollRafRef.current = requestAnimationFrame(step);
    };

    scrollRafRef.current = requestAnimationFrame(step);

    return () => {
      if (scrollRafRef.current) {
        cancelAnimationFrame(scrollRafRef.current);
        scrollRafRef.current = null;
      }
    };
  }, [isAutoScrolling, scrollSpeed]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        toggleAutoScroll();
      } else if (e.key === "ArrowRight" || e.key === "PageDown") {
        handleNext();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        handlePrev();
      } else if (e.key === "Escape") {
        onExit();
      } else if (e.key === "+" || e.key === "=") {
        handleFontSizeChange(1);
      } else if (e.key === "-") {
        handleFontSizeChange(-1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev, onExit]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 75;

    if (distance > minSwipeDistance) {
      handleNext();
    } else if (distance < -minSwipeDistance) {
      handlePrev();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  if (!currentSong) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center text-[var(--color-text-secondary)] p-6 bg-[var(--color-bg-page)]">
        <div className="text-center space-y-4 animate-ui-fade">
          <p className="text-sm font-semibold">Carregando louvor...</p>
          <button
            onClick={onExit}
            className="px-5 py-2.5 bg-[var(--color-accent)] text-[var(--color-accent-contrast)] font-bold rounded-full text-xs emil-press shadow-md shadow-[var(--color-accent)]/20"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  const isStarred = isSongInActiveSetlist(currentSong.id);
  const totalSlots = sourceTab === "setlists" ? activeItemsWithSongs.length : 0;

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="min-h-[100dvh] bg-[var(--color-bg-page)] text-[var(--color-text-primary)] flex flex-col justify-between relative selection:bg-[var(--color-accent)]/20"
    >
      {/* Translucent top header with optical h-8 alignment */}
      <header className="sticky top-0 z-40 bg-[var(--color-bg-page)]/85 border-b border-[var(--color-border-subtle)] backdrop-blur-xl px-2.5 sm:px-6 py-2 pt-[max(0.5rem,env(safe-area-inset-top,0px))]">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-1.5 sm:gap-4">
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-1">
            <button
              onClick={onExit}
              className="h-8 w-8 sm:w-auto sm:px-3 flex items-center justify-center gap-1.5 rounded-full bg-[var(--color-bg-subtle)] border border-[var(--color-border-subtle)] hover:bg-[var(--color-bg-card)] text-[var(--color-text-primary)] text-xs font-bold emil-press shrink-0"
              title={sourceTab === "setlists" ? "Voltar à Lista" : "Voltar ao Índice"}
            >
              <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">
                {sourceTab === "setlists" ? "Lista" : "Índice"}
              </span>
            </button>

            <div className="min-w-0 flex flex-col justify-center flex-1">
              <div className="flex items-center gap-2 leading-tight">
                {sourceTab === "setlists" && (
                  <span className="shrink-0 px-2 py-0.5 rounded-full bg-[var(--color-accent)]/15 text-[var(--color-accent)] border border-[var(--color-accent)]/30 text-[11px] font-mono tnum font-bold select-none leading-none">
                    0{currentIndex + 1}
                  </span>
                )}
                <h1 className="text-sm sm:text-lg font-black text-[var(--color-text-primary)] truncate tracking-tight leading-tight">
                  {currentSong.title}
                </h1>
              </div>
              {currentSong.artist && (
                <p className="text-[11px] sm:text-xs text-[var(--color-text-secondary)] truncate leading-none mt-0.5">
                  {currentSong.artist}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Toggle Cifras / Letras */}
            <button
              onClick={toggleHideChords}
              className={`h-8 w-8 sm:w-auto sm:px-3 flex items-center justify-center gap-1.5 rounded-full text-xs font-bold emil-press border shrink-0 ${
                hideChords
                  ? "bg-[var(--color-accent)] text-[var(--color-accent-contrast)] border-[var(--color-accent)] shadow-sm"
                  : "bg-[var(--color-bg-subtle)] border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card)]"
              }`}
              title={hideChords ? "Exibir cifras" : "Ocultar cifras (modo letra pura)"}
            >
              {hideChords ? <Type className="w-3.5 h-3.5 shrink-0" /> : <Music2 className="w-3.5 h-3.5 shrink-0" />}
              <span className="hidden sm:inline">{hideChords ? "Letra" : "Cifras"}</span>
            </button>

            {/* Toggle 2 Colunas */}
            <button
              onClick={toggleTwoColumns}
              className={`hidden md:flex h-8 px-2.5 items-center gap-1.5 rounded-full text-xs font-bold emil-press border ${
                twoColumns
                  ? "bg-[var(--color-accent)] text-[var(--color-accent-contrast)] border-[var(--color-accent)] shadow-sm"
                  : "bg-[var(--color-bg-subtle)] border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card)]"
              }`}
              title={twoColumns ? "Visualização em 1 coluna" : "Visualização em 2 colunas (lado a lado)"}
            >
              {twoColumns ? <Columns2 className="w-3.5 h-3.5 shrink-0" /> : <AlignLeft className="w-3.5 h-3.5 shrink-0" />}
              <span>{twoColumns ? "2 Colunas" : "1 Coluna"}</span>
            </button>

            {/* Star toggle */}
            <button
              onClick={() => toggleSongInActiveSetlist(currentSong)}
              title={isStarred ? `Remover de ${activeSetlist?.name}` : `Adicionar em ${activeSetlist?.name}`}
              className={`w-8 h-8 flex items-center justify-center rounded-full border emil-press ${
                isStarred
                  ? "bg-[var(--color-accent)] text-[var(--color-accent-contrast)] border-[var(--color-accent)] shadow-sm"
                  : "bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] border-[var(--color-border-subtle)] hover:bg-[var(--color-bg-card)]"
              }`}
            >
              <Star className={`w-3.5 h-3.5 shrink-0 ${isStarred ? "fill-current" : ""}`} />
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="w-8 h-8 flex items-center justify-center rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] emil-press"
              title={theme === "light" ? "Modo Palco Escuro (#4B2E2B)" : "Modo Hinário Creme (#FFF8F0)"}
            >
              {theme === "light" ? <Moon className="w-3.5 h-3.5 shrink-0" /> : <Sun className="w-3.5 h-3.5 text-[var(--color-accent)] shrink-0" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Reader View */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <ChordViewer
          song={currentSong}
          currentKey={currentKey}
          fontSize={fontSize}
          hideChords={hideChords}
          twoColumns={twoColumns}
        />
      </main>

      {/* Floating Capsule Bar */}
      <BottomNavBar
        currentSlotIndex={currentIndex}
        totalSlots={totalSlots}
        currentKey={currentKey}
        originalKey={currentSong.originalKey}
        fontSize={fontSize}
        isAutoScrolling={isAutoScrolling}
        scrollSpeed={scrollSpeed}
        onPrev={handlePrev}
        onNext={handleNext}
        onBack={onExit}
        onChangeKey={handleKeyChange}
        onStepKey={handleStepKey}
        onChangeFontSize={handleFontSizeChange}
        onToggleAutoScroll={toggleAutoScroll}
        onChangeScrollSpeed={handleChangeScrollSpeed}
      />
    </div>
  );
};
