import QRCode from 'qrcode';
import type { QrSetlistPayload, SetlistItem } from '../types';

const QR_PREFIX = 'BZN1:';

export function encodeSetlistToPayload(name: string, items: SetlistItem[]): string {
  const payload: QrSetlistPayload = {
    v: 1,
    n: name.trim().slice(0, 40),
    s: items.map((it) => [it.songId, it.customKey])
  };
  return QR_PREFIX + JSON.stringify(payload);
}

export function decodePayloadToSetlist(
  raw: string
): { name: string; items: { songId: string; customKey: string }[] } | null {
  try {
    const trimmed = raw.trim();
    const jsonStr = trimmed.startsWith(QR_PREFIX)
      ? trimmed.slice(QR_PREFIX.length)
      : trimmed;

    const parsed: QrSetlistPayload = JSON.parse(jsonStr);
    if (!parsed || !parsed.n || !Array.isArray(parsed.s)) {
      return null;
    }

    return {
      name: parsed.n,
      items: parsed.s.map(([songId, customKey]) => ({
        songId,
        customKey: customKey || 'C'
      }))
    };
  } catch (err) {
    return null;
  }
}

export async function generateQrDataUrl(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'M',
    margin: 2,
    color: {
      dark: '#1D1211',
      light: '#FFF8F0'
    },
    width: 320
  });
}
