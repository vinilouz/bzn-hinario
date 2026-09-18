import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  ArrowLeft
} from "lucide-react";
import { COMMON_KEYS } from "../services/chordEngine";

interface BottomNavBarProps {
  currentSlotIndex: number;
  totalSlots: number;
  currentKey: string;
  originalKey: string;
  fontSize: number;
  isAutoScrolling: boolean;
  scrollSpeed: number;
  onPrev: () => void;
  onNext: () => void;
  onBack: () => void;
  onChangeKey: (key: string) => void;
  onStepKey: (semitones: number) => void;
  onChangeFontSize: (delta: number) => void;
  onToggleAutoScroll: () => void;
  onChangeScrollSpeed: (delta: number) => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentSlotIndex,
  totalSlots,
  currentKey,
  originalKey,
  fontSize,
  isAutoScrolling,
  scrollSpeed,
  onPrev,
  onNext,
  onBack,
  onChangeKey,
  onStepKey,
  onChangeFontSize,
  onToggleAutoScroll,
  onChangeScrollSpeed
}) => {
  const isTransposed = currentKey !== originalKey;

  return (
    <nav
      aria-label="Controles de Leitura"
      className="fixed bottom-[max(0.75rem,calc(env(safe-area-inset-bottom,0px)+0.5rem))] left-0 right-0 z-50 flex justify-center px-2 sm:px-4 pointer-events-none"
    >
      <div className="pointer-events-auto max-w-[calc(100vw-1rem)] apple-glass rounded-full px-2 sm:px-4 py-2 sm:py-2.5 shadow-2xl shadow-black/30 flex items-center justify-between gap-1.5 sm:gap-3 border border-[var(--color-border-subtle)] animate-ui-fade">
        <div className="flex items-center gap-1">
          <button
            onClick={onBack}
            className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center rounded-full bg-[var(--color-bg-subtle)] hover:bg-[var(--color-bg-card)] text-[var(--color-text-primary)] emil-press shrink-0"
            title="Sair do modo leitura"
          >
            <ArrowLeft className="w-5 h-5 shrink-0" />
          </button>

          {totalSlots > 0 && (
            <button
              onClick={onPrev}
              disabled={totalSlots <= 1 || currentSlotIndex === 0}
              className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center rounded-full bg-[var(--color-bg-subtle)] hover:bg-[var(--color-bg-card)] disabled:opacity-25 text-[var(--color-text-primary)] emil-press shrink-0"
              title="Música anterior (←)"
            >
              <ChevronLeft className="w-5 h-5 shrink-0" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {/* Key transposer: exact h-9 height */}
          <div className="h-9 sm:h-11 flex items-center bg-[var(--color-bg-subtle)] rounded-full px-1 sm:px-1.5 border border-[var(--color-border-subtle)] shadow-inner shrink-0">
            <button
              onClick={() => onStepKey(-1)}
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card)] emil-press text-sm sm:text-base font-black"
              title="Baixar meio tom (♭)"
            >
              ♭
            </button>

            <select
              value={currentKey}
              onChange={(e) => onChangeKey(e.target.value)}
              className="bg-transparent text-[var(--color-accent)] font-mono font-black text-sm sm:text-base px-2 py-0.5 focus:outline-none cursor-pointer text-center leading-none"
              title={isTransposed ? `Tom original: ${originalKey}` : "Tom original"}
            >
              {COMMON_KEYS.map((k) => (
                <option key={k} value={k} className="bg-[var(--color-bg-page)] text-[var(--color-text-primary)]">
                  {k}
                </option>
              ))}
            </select>

            <button
              onClick={() => onStepKey(1)}
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card)] emil-press text-sm sm:text-base font-black"
              title="Subir meio tom (♯)"
            >
              ♯
            </button>
          </div>

          {/* Auto-scroll Controller: exact h-9 height */}
          <div className="h-9 sm:h-11 flex items-center bg-[var(--color-bg-subtle)] rounded-full px-1 sm:px-1.5 border border-[var(--color-border-subtle)] shadow-inner shrink-0">
            <button
              onClick={onToggleAutoScroll}
              className={`h-8 sm:h-9 px-3 sm:px-3.5 flex items-center gap-1.5 rounded-full text-xs sm:text-sm font-bold emil-press ${
                isAutoScrolling
                  ? "bg-[var(--color-accent)] text-[var(--color-accent-contrast)] shadow-sm shadow-[var(--color-accent)]/20"
                  : "text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card)]"
              }`}
              title="Rolagem automática (Barra de Espaço)"
            >
              {isAutoScrolling ? (
                <>
                  <Pause className="w-4 h-4 fill-current shrink-0" />
                  <span className="text-xs font-mono tnum font-bold hidden xs:inline">{scrollSpeed}x</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current shrink-0" />
                  <span className="text-xs font-mono font-bold hidden xs:inline">Rolar</span>
                </>
              )}
            </button>

            {isAutoScrolling && (
              <button
                onClick={() => onChangeScrollSpeed(1)}
                className="w-7 h-7 sm:w-8 sm:h-8 ml-0.5 flex items-center justify-center text-xs font-mono tnum font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] emil-press rounded-full hover:bg-[var(--color-bg-card)]"
                title="Alterar velocidade de rolagem"
              >
                +{scrollSpeed}
              </button>
            )}
          </div>

          {/* Font Resizer: exact h-9 height */}
          <div className="h-9 sm:h-11 flex items-center bg-[var(--color-bg-subtle)] rounded-full px-1 sm:px-1.5 border border-[var(--color-border-subtle)] shadow-inner shrink-0">
            <button
              onClick={() => onChangeFontSize(-1)}
              disabled={fontSize <= 14}
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card)] emil-press text-xs sm:text-sm font-black disabled:opacity-25"
              title="Diminuir tamanho do texto"
            >
              A-
            </button>
            <span className="text-xs sm:text-sm font-mono tnum text-[var(--color-text-secondary)] px-2 font-black select-none hidden xs:inline leading-none">
              {fontSize}
            </span>
            <button
              onClick={() => onChangeFontSize(1)}
              disabled={fontSize >= 48}
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card)] emil-press text-xs sm:text-sm font-black disabled:opacity-25"
              title="Aumentar tamanho do texto"
            >
              A+
            </button>
          </div>
        </div>

        {totalSlots > 0 && (
          <div className="flex items-center gap-1">
            <button
              onClick={onNext}
              disabled={totalSlots <= 1 || currentSlotIndex === totalSlots - 1}
              className="h-9 sm:h-11 px-3.5 sm:px-4 flex items-center gap-1.5 rounded-full bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-accent-contrast)] disabled:opacity-25 text-xs sm:text-sm font-bold shadow-md shadow-[var(--color-accent)]/20 emil-press shrink-0"
              title="Próxima música (→)"
            >
              <span className="hidden sm:inline">Próxima</span>
              <ChevronRight className="w-5 h-5 shrink-0" />
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};
