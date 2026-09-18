import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Copy, Check, QrCode } from "lucide-react";
import { encodeSetlistToPayload, generateQrDataUrl } from "../services/qrSharing";
import { db } from "../db/dexie";
import type { Setlist, Song } from "../types";

interface ShareQrModalProps {
  isOpen: boolean;
  setlist: Setlist | null;
  onClose: () => void;
}

export const ShareQrModal: React.FC<ShareQrModalProps> = ({ isOpen, setlist, onClose }) => {
  const [qrUrl, setQrUrl] = useState<string>("");
  const [payload, setPayload] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    if (isOpen && setlist) {
      (async () => {
        setIsGenerating(true);
        const fullSongs: Song[] = [];
        for (const item of setlist.items) {
          const s = await db.songs.get(item.songId);
          if (s && !s.isDeleted) {
            fullSongs.push(s);
          }
        }
        const code = await encodeSetlistToPayload(setlist.name, setlist.items, fullSongs);
        if (!isCancelled) {
          setPayload(code);
          const url = await generateQrDataUrl(code);
          setQrUrl(url);
          setIsGenerating(false);
        }
      })().catch((err) => {
        console.error("Erro ao gerar payload do QR Code:", err);
        if (!isCancelled) setIsGenerating(false);
      });
    } else {
      setQrUrl("");
      setPayload("");
      setCopied(false);
      setIsGenerating(false);
    }
    return () => {
      isCancelled = true;
    };
  }, [isOpen, setlist]);

  if (!isOpen || !setlist) return null;
  if (typeof document === "undefined") return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn("Clipboard failed:", err);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] max-h-[calc(100dvh-2rem)] sheet-scroll rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 animate-modal-pop text-center my-auto pb-[max(1.5rem,env(safe-area-inset-bottom,0px))]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-3">
          <div className="flex items-center gap-2.5 text-left">
            <div className="w-8 h-8 rounded-full bg-[var(--color-accent)]/15 text-[var(--color-accent)] flex items-center justify-center shrink-0">
              <QrCode className="w-4 h-4 shrink-0" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-[var(--color-text-primary)] truncate max-w-[200px] leading-tight">
                {setlist.name}
              </h2>
              <p className="text-[11px] text-[var(--color-text-secondary)] font-mono tnum leading-none mt-0.5">
                {setlist.items.length} {setlist.items.length === 1 ? "música" : "músicas"} • 100% Offline
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-subtle)] emil-press"
          >
            <X className="w-4 h-4 shrink-0" />
          </button>
        </div>

        <div className="flex flex-col items-center justify-center p-3 bg-[#FFF8F0] rounded-2xl shadow-inner border border-[#8C5A3C]/30 min-h-[220px]">
          {isGenerating ? (
            <div className="max-w-[220px] sm:max-w-[240px] w-full aspect-square flex flex-col items-center justify-center text-[var(--color-text-secondary)] text-xs mx-auto gap-2">
              <div className="w-6 h-6 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
              <span>Compactando cifras offline...</span>
            </div>
          ) : qrUrl ? (
            <img
              src={qrUrl}
              alt="QR Code da Lista"
              className="max-w-[220px] sm:max-w-[240px] w-full aspect-square object-contain rounded-lg mx-auto"
            />
          ) : (
            <div className="max-w-[220px] sm:max-w-[240px] w-full aspect-square flex flex-col items-center justify-center text-[var(--color-text-secondary)] text-xs mx-auto p-4 text-center">
              <p className="font-semibold text-[var(--color-text-primary)]">Lista extensa</p>
              <p className="text-[11px] mt-1">
                A lista possui muitas músicas para a câmera ler. Use o botão <strong>Copiar Código</strong> abaixo para transferir!
              </p>
            </div>
          )}
        </div>

        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
          Transfere a lista e as <strong>cifras completas</strong> de aparelho para aparelho sem precisar de internet ou servidor.
        </p>

        <div className="pt-2 flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 h-9 flex items-center justify-center gap-1.5 px-3 rounded-full bg-[var(--color-bg-subtle)] border border-[var(--color-border-subtle)] hover:bg-[var(--color-bg-card)] text-xs font-semibold text-[var(--color-text-primary)] emil-press"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[var(--color-accent)] shrink-0" />
                <span className="text-[var(--color-accent)] font-bold">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[var(--color-accent)] shrink-0" />
                <span>Copiar Código</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="h-9 px-4 rounded-full bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-accent-contrast)] text-xs font-bold emil-press shadow-sm"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
