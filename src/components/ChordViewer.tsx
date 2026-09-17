import React, { useMemo } from "react";
import { renderChordSheet, getSemitoneDiff } from "../services/chordEngine";
import type { Song } from "../types";

interface ChordViewerProps {
  song: Song;
  currentKey: string;
  fontSize: number;
  hideChords?: boolean;
  twoColumns?: boolean;
}

export const ChordViewer: React.FC<ChordViewerProps> = ({
  song,
  currentKey,
  fontSize,
  hideChords = false,
  twoColumns = false
}) => {
  const semitones = useMemo(() => {
    return getSemitoneDiff(song.originalKey, currentKey);
  }, [song.originalKey, currentKey]);

  const renderedHtml = useMemo(() => {
    return renderChordSheet(song.content, song.format, semitones);
  }, [song.content, song.format, semitones]);

  return (
    <div
      style={{ fontSize: `${fontSize}px` }}
      className={`w-full font-mono selectable-text pb-32 sm:pb-36 transition-[font-size] duration-150 ease-out ${
        hideChords ? "lyrics-only" : ""
      } ${twoColumns ? "chord-sheet-2col" : ""}`}
    >
      <div
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
        className="select-text tracking-normal"
      />
    </div>
  );
};
