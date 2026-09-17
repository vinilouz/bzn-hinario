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

export function extractCifraClubKey(content: string): string | null {
  const match = content.match(/^\s*Tom:\s*([A-G][#b]?m?)/im);
  return match ? match[1] : null;
}

export function cleanCifraClubArtifacts(text: string): string {
  if (!text) return '';
  const lines = text.split('\n');
  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const chordMatch = line.match(/^">\s*([A-G][^\n]*)$/);
    if (chordMatch) {
      const chord = chordMatch[1].trim();
      const nextLine = lines[i + 1] ? lines[i + 1].trim() : '';

      let duplicateIdx = -1;
      for (let j = result.length - 1; j >= Math.max(0, result.length - 6); j--) {
        if (result[j].trim() === nextLine && nextLine.length > 0) {
          duplicateIdx = j;
          break;
        }
      }

      if (duplicateIdx !== -1) {
        const chordsLineIdx = duplicateIdx - 1;
        if (chordsLineIdx >= 0 && result[chordsLineIdx].trim().length > 0) {
          result[chordsLineIdx] = result[chordsLineIdx].trimEnd() + '  ' + chord;
        } else if (chordsLineIdx >= 0) {
          result[chordsLineIdx] = chord;
        } else {
          result.splice(duplicateIdx, 0, chord);
        }
        i++;
        continue;
      }

      let prevHeaderIdx = -1;
      for (let j = result.length - 1; j >= Math.max(0, result.length - 3); j--) {
        if (result[j].trim().startsWith('[') && result[j].trim().endsWith(']')) {
          prevHeaderIdx = j;
          break;
        }
      }

      if (prevHeaderIdx !== -1) {
        result.push(chord);
        let lookAhead = i + 1;
        while (lookAhead < lines.length && lines[lookAhead].trim() === '') {
          lookAhead++;
        }
        if (lookAhead < lines.length && lines[lookAhead].trim() === result[prevHeaderIdx].trim()) {
          i = lookAhead;
        }
        continue;
      }

      result.push(chord);
      continue;
    }

    result.push(line);
  }

  const deduped: string[] = [];
  let lastHeader = '';
  for (let i = 0; i < result.length; i++) {
    const rawLine = result[i];
    const trimmed = rawLine.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      if (trimmed === lastHeader) {
        continue;
      }
      lastHeader = trimmed;
    } else if (trimmed.length > 0) {
      lastHeader = '';
    }

    if (trimmed === '' && deduped.length > 0 && deduped[deduped.length - 1].trim() === '') {
      continue;
    }
    deduped.push(rawLine);
  }

  return deduped.join('\n');
}

export function preprocessChordSheet(raw: string): string {
  if (!raw) return '';
  let text = cleanCifraClubArtifacts(raw);

  text = text.replace(/^(\s*\[[^\]]+\])\s+([A-G][^\n]*)$/gm, '$1\n$2');
  text = text.replace(/^\s*Tom:\s*[A-G][#b]?m?\s*$/gim, '');
  text = text.replace(/^\s*(?:Capotraste|Afinação|Intro):\s*.*$/gim, '');
  text = text.replace(/([A-G][#b]?)7M(\b|\/)/g, '$1maj7$2');
  text = text.replace(/([A-G][#b]?)7\+(\b|\/)/g, '$1maj7$2');

  return text;
}

export function postprocessHtml(html: string): string {
  if (!html) return '';
  return html.replace(/(class="chord">[^<]*?)ma(?:j)?7/g, '$17M');
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
    const isChordPro = format === 'chordpro';
    const parser = isChordPro ? cpParser : cowParser;
    const cleanContent = isChordPro ? content : preprocessChordSheet(content);
    let song = parser.parse(cleanContent);
    if (semitones !== 0) {
      song = song.transpose(semitones);
    }
    const html = htmlFormatter.format(song);
    return isChordPro ? html : postprocessHtml(html);
  } catch (error) {
    console.error('Chord render error:', error);
    return `<pre class="whitespace-pre-wrap font-mono text-[var(--color-text-primary)]">${content}</pre>`;
  }
}
