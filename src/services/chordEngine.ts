import ChordSheetJS from 'chordsheetjs';

const SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLATS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const FLAT_TO_SHARP: Record<string, string> = {
  Db: 'C#',
  Eb: 'D#',
  Gb: 'F#',
  Ab: 'G#',
  Bb: 'A#'
};

export const COMMON_KEYS = [
  'C', 'C#', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B',
  'Cm', 'C#m', 'Dm', 'Ebm', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'Bbm', 'Bm'
];

function normalizeRoot(note: string): string {
  return FLAT_TO_SHARP[note] || note;
}

export function transposeKeyName(key: string, semitones: number): string {
  if (!key) return '';
  const match = key.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return key;
  const rawRoot = match[1];
  const suffix = match[2];
  const isFlat = rawRoot.includes('b');
  const normalized = normalizeRoot(rawRoot);
  const idx = SHARPS.indexOf(normalized);
  if (idx === -1) return key;
  const newIdx = (idx + (semitones % 12) + 12) % 12;
  const scale = isFlat ? FLATS : SHARPS;
  return scale[newIdx] + suffix;
}

export function getSemitoneDiff(fromKey: string, toKey: string): number {
  if (!fromKey || !toKey) return 0;
  const fromMatch = fromKey.match(/^([A-G][#b]?)/);
  const toMatch = toKey.match(/^([A-G][#b]?)/);
  if (!fromMatch || !toMatch) return 0;
  const fromIdx = SHARPS.indexOf(normalizeRoot(fromMatch[1]));
  const toIdx = SHARPS.indexOf(normalizeRoot(toMatch[1]));
  if (fromIdx === -1 || toIdx === -1) return 0;
  let diff = (toIdx - fromIdx) % 12;
  if (diff > 6) diff -= 12;
  if (diff <= -6) diff += 12;
  return diff;
}

export function detectFormat(content: string): 'chordpro' | 'chords-over-lyrics' {
  if (/\[[A-G][#b]?(?:m|maj|min|dim|aug|sus[24]?|[0-9])?(?:\/[A-G][#b]?)?\]/.test(content)) {
    return 'chordpro';
  }
  return 'chords-over-lyrics';
}

const cowParser = new ChordSheetJS.ChordsOverWordsParser();
const cpParser = new ChordSheetJS.ChordProParser();
const htmlFormatter = new ChordSheetJS.HtmlDivFormatter();

export function renderChordSheet(
  content: string,
  format: 'chordpro' | 'chords-over-lyrics',
  semitones: number = 0
): string {
  if (!content) return '';
  try {
    const parser = format === 'chordpro' ? cpParser : cowParser;
    let song = parser.parse(content);
    if (semitones !== 0) {
      song = song.transpose(semitones);
    }
    return htmlFormatter.format(song);
  } catch (error) {
    console.error('Chord render error:', error);
    return `<pre class="whitespace-pre-wrap font-mono text-[var(--color-text-primary)]">${content}</pre>`;
  }
}
