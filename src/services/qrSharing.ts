import QRCode from 'qrcode';
import type { QrSetlistPayload, SetlistItem, Song } from '../types';

const QR_PREFIX_V1 = 'BZN1:';
const QR_PREFIX_V2 = 'BZN2:';

export async function compressString(str: string): Promise<string> {
  if (typeof CompressionStream === 'undefined') {
    return 'RAW:' + btoa(unescape(encodeURIComponent(str)));
  }
  try {
    const stream = new Blob([str]).stream().pipeThrough(new CompressionStream('deflate-raw'));
    const buffer = await new Response(stream).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return 'Z:' + btoa(binary);
  } catch {
    return 'RAW:' + btoa(unescape(encodeURIComponent(str)));
  }
}

export async function decompressString(encoded: string): Promise<string> {
  if (encoded.startsWith('RAW:')) {
    return decodeURIComponent(escape(atob(encoded.slice(4))));
  }
  if (encoded.startsWith('Z:')) {
    if (typeof DecompressionStream === 'undefined') {
      throw new Error('Decompressão não suportada neste navegador.');
    }
    const binary = atob(encoded.slice(2));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return await new Response(stream).text();
  }
  return encoded;
}

export async function encodeSetlistToPayload(
  name: string,
  items: SetlistItem[],
  songs?: Song[]
): Promise<string> {
  const payload: QrSetlistPayload = {
    v: 2,
    n: name.trim().slice(0, 40),
    s: items.map((it) => [it.songId, it.customKey]),
    songs: songs && songs.length > 0 ? songs : undefined
  };

  const jsonStr = JSON.stringify(payload);
  const compressed = await compressString(jsonStr);
  return QR_PREFIX_V2 + compressed;
}

export async function decodePayloadToSetlist(
  raw: string
): Promise<{
  name: string;
  items: { songId: string; customKey: string }[];
  songs?: Song[];
} | null> {
  try {
    const trimmed = raw.trim();
    let jsonStr = '';

    if (trimmed.startsWith(QR_PREFIX_V2)) {
      jsonStr = await decompressString(trimmed.slice(QR_PREFIX_V2.length));
    } else if (trimmed.startsWith(QR_PREFIX_V1)) {
      jsonStr = trimmed.slice(QR_PREFIX_V1.length);
    } else {
      jsonStr = trimmed;
    }

    const parsed: QrSetlistPayload = JSON.parse(jsonStr);
    if (!parsed || !parsed.n || !Array.isArray(parsed.s)) {
      return null;
    }

    return {
      name: parsed.n,
      items: parsed.s.map(([songId, customKey]) => ({
        songId,
        customKey: customKey || 'C'
      })),
      songs: Array.isArray(parsed.songs) ? parsed.songs : undefined
    };
  } catch (err) {
    console.warn('Falha ao decodificar QR/código:', err);
    return null;
  }
}

export async function generateQrDataUrl(payload: string): Promise<string> {
  try {
    return await QRCode.toDataURL(payload, {
      errorCorrectionLevel: payload.length > 600 ? 'L' : 'M',
      margin: 2,
      color: {
        dark: '#1D1211',
        light: '#FFF8F0'
      },
      width: 320
    });
  } catch (err) {
    console.warn('QR code muito grande para renderização visual:', err);
    return '';
  }
}
