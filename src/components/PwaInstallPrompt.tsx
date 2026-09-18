import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Download,
  Share,
  SquarePlus,
  MoreVertical,
  Check,
  X,
  Smartphone,
  Laptop,
  WifiOff,
  Maximize2,
  Sparkles,
  ChevronRight,
  Music2,
} from "lucide-react";

type Platform = "ios" | "android" | "desktop";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_STORAGE_KEY = "bzn_hinario_pwa_dismissed_until";
const DISMISS_DURATION_MS = 5 * 24 * 60 * 60 * 1000; // 5 dias

function detectPlatform(): Platform {
  if (typeof window === "undefined" || typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent || "";
  const platform = (navigator as unknown as { platform?: string }).platform || "";

  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (isIOS) return "ios";

  if (/Android/i.test(ua)) return "android";

  return "desktop";
}

function checkIsStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
  const isIosStandalone =
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  const isAndroidApp = document.referrer.startsWith("android-app://");
  return isStandalone || isIosStandalone || isAndroidApp;
}

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(checkIsStandalone);
  const [showBanner, setShowBanner] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [platform] = useState<Platform>(detectPlatform);
  const [activeTab, setActiveTab] = useState<Platform>(detectPlatform);
  const [installSuccess, setInstallSuccess] = useState(false);

  useEffect(() => {
    if (isInstalled) {
      return;
    }

    const dismissedUntil = localStorage.getItem(DISMISS_STORAGE_KEY);
    const isDismissed = dismissedUntil ? Date.now() < Number(dismissedUntil) : false;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowBanner(false);
      setIsModalOpen(false);
    };

    const handleOpenCustom = () => {
      setIsModalOpen(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("open-pwa-install-modal", handleOpenCustom);

    let timer: ReturnType<typeof setTimeout> | null = null;
    if (!isDismissed) {
      timer = setTimeout(() => {
        setShowBanner(true);
      }, 1200);
    }

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("open-pwa-install-modal", handleOpenCustom);
    };
  }, [isInstalled]);

  const handleDismiss = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setShowBanner(false);
    try {
      localStorage.setItem(DISMISS_STORAGE_KEY, String(Date.now() + DISMISS_DURATION_MS));
    } catch (err) {
      console.warn("Could not save dismissal:", err);
    }
  }, []);

  const handleNativeInstall = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setInstallSuccess(true);
        setTimeout(() => {
          setIsModalOpen(false);
          setShowBanner(false);
        }, 1500);
      }
    } catch (err) {
      console.warn("Install prompt error:", err);
    }
  };

  useEffect(() => {
    if (isModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setIsModalOpen(false);
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isModalOpen]);

  return (
    <>
      {/* Subtle Apple-style Floating Popup Banner */}
      {showBanner && !isInstalled && !isModalOpen && (
        <aside
          role="region"
          aria-label="Sugestão de instalação do Hinário"
          onClick={() => setIsModalOpen(true)}
          className="fixed z-40 bottom-[calc(4.85rem+env(safe-area-inset-bottom,0px))] left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 sm:w-84 apple-glass rounded-2xl p-3 shadow-xl shadow-black/10 dark:shadow-black/40 border border-[var(--color-border-subtle)] flex items-center justify-between gap-3 animate-ui-fade cursor-pointer group emil-hover-lift"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-accent)] flex items-center justify-center text-[var(--color-accent-contrast)] shadow-sm shadow-[var(--color-accent)]/20 shrink-0 group-hover:scale-105 transition-transform">
              <Download className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black tracking-tight text-[var(--color-text-primary)] truncate">
                  Instale e use offline
                </span>
                <span className="inline-block px-1.5 py-0.2 rounded-full bg-[var(--color-accent)]/15 text-[var(--color-accent)] text-[10px] font-bold font-mono">
                  App
                </span>
              </div>
              <p className="text-[11px] text-[var(--color-text-secondary)] font-medium truncate mt-0.5">
                Acesse todas as cifras sem internet
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <div className="w-7 h-7 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              className="w-7 h-7 flex items-center justify-center rounded-full text-[var(--color-text-secondary)]/70 hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-subtle)] transition-colors emil-press"
              aria-label="Dispensar sugestão de instalação"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}

      {/* Onboarding Bottom Sheet / Modal */}
      {isModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] overflow-y-auto bg-black/65 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setIsModalOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="pwa-modal-title"
          >
            <div
              className="w-full max-w-md bg-[var(--color-bg-card)] border-t sm:border border-[var(--color-border-subtle)] rounded-t-[28px] sm:rounded-3xl max-h-[90dvh] sheet-scroll shadow-2xl p-5 sm:p-6 space-y-4 animate-sheet-slide-up sm:animate-modal-pop text-left my-0 sm:my-auto pb-[max(1.75rem,env(safe-area-inset-bottom,0px))]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Mobile Grab Handle */}
              <div className="sm:hidden w-10 h-1 rounded-full bg-[var(--color-text-secondary)]/30 mx-auto -mt-1 mb-2" />

              {/* Modal Top Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[var(--color-accent)] text-[var(--color-accent-contrast)] flex items-center justify-center shadow-md shadow-[var(--color-accent)]/25 shrink-0">
                    <Music2 className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <h2
                      id="pwa-modal-title"
                      className="text-lg sm:text-xl font-black tracking-tight text-[var(--color-text-primary)] leading-tight"
                    >
                      Instale o Hinário
                    </h2>
                    <p className="text-xs text-[var(--color-text-secondary)] font-medium mt-0.5">
                      Pronto para usar mesmo sem sinal ou Wi-Fi.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-subtle)] emil-press shrink-0"
                  aria-label="Fechar guia de instalação"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Platform Segmented Control */}
              <div
                className="bg-[var(--color-bg-subtle)] border border-[var(--color-border-subtle)] p-1 rounded-2xl flex items-center gap-1"
                role="tablist"
                aria-label="Selecionar sistema operacional"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "ios"}
                  onClick={() => setActiveTab("ios")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1.5 rounded-xl text-xs font-bold emil-press transition-all ${
                    activeTab === "ios"
                      ? "bg-[var(--color-bg-card)] text-[var(--color-accent)] shadow-sm font-black"
                      : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5 shrink-0" />
                  <span>iPhone / iPad</span>
                  {platform === "ios" && (
                    <span
                      title="Dispositivo detectado"
                      className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] shrink-0"
                    />
                  )}
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "android"}
                  onClick={() => setActiveTab("android")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1.5 rounded-xl text-xs font-bold emil-press transition-all ${
                    activeTab === "android"
                      ? "bg-[var(--color-bg-card)] text-[var(--color-accent)] shadow-sm font-black"
                      : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5 shrink-0" />
                  <span>Android</span>
                  {platform === "android" && (
                    <span
                      title="Dispositivo detectado"
                      className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] shrink-0"
                    />
                  )}
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "desktop"}
                  onClick={() => setActiveTab("desktop")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1.5 rounded-xl text-xs font-bold emil-press transition-all ${
                    activeTab === "desktop"
                      ? "bg-[var(--color-bg-card)] text-[var(--color-accent)] shadow-sm font-black"
                      : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                  }`}
                >
                  <Laptop className="w-3.5 h-3.5 shrink-0" />
                  <span>Computador</span>
                  {platform === "desktop" && (
                    <span
                      title="Dispositivo detectado"
                      className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] shrink-0"
                    />
                  )}
                </button>
              </div>

              {/* iOS Onboarding Instructions */}
              {activeTab === "ios" && (
                <div className="space-y-2.5 animate-ui-fade">
                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-[var(--color-bg-subtle)] border border-[var(--color-border-subtle)]">
                    <div className="w-8 h-8 rounded-xl bg-[var(--color-accent)]/15 text-[var(--color-accent)] flex items-center justify-center shrink-0 mt-0.5">
                      <Share className="w-4 h-4 stroke-[2.4]" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-[var(--color-text-primary)]">
                        1. Toque no botão Compartilhar
                      </h3>
                      <p className="text-[11px] sm:text-xs text-[var(--color-text-secondary)] mt-0.5 leading-relaxed">
                        Na barra inferior do <strong>Safari</strong> (ou topo no iPad), toque no ícone de <strong>Compartilhar</strong> (quadrado com seta para cima).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-[var(--color-bg-subtle)] border border-[var(--color-border-subtle)]">
                    <div className="w-8 h-8 rounded-xl bg-[var(--color-accent)]/15 text-[var(--color-accent)] flex items-center justify-center shrink-0 mt-0.5">
                      <SquarePlus className="w-4 h-4 stroke-[2.4]" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-[var(--color-text-primary)]">
                        2. "Adicionar à Tela de Início"
                      </h3>
                      <p className="text-[11px] sm:text-xs text-[var(--color-text-secondary)] mt-0.5 leading-relaxed">
                        Role a folha de opções para baixo e toque em <strong>"Adicionar à Tela de Início"</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-[var(--color-bg-subtle)] border border-[var(--color-border-subtle)]">
                    <div className="w-8 h-8 rounded-xl bg-[var(--color-accent)]/15 text-[var(--color-accent)] flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-[var(--color-text-primary)]">
                        3. Toque em "Adicionar"
                      </h3>
                      <p className="text-[11px] sm:text-xs text-[var(--color-text-secondary)] mt-0.5 leading-relaxed">
                        No canto superior direito, confirme tocando em <strong>Adicionar</strong>. O ícone aparecerá na tela do seu iPhone.
                      </p>
                    </div>
                  </div>

                  <p className="text-[11px] text-[var(--color-text-secondary)] text-center italic pt-0.5">
                    Dica: No iPhone/iPad, a instalação é realizada diretamente pelo navegador <strong>Safari</strong>.
                  </p>
                </div>
              )}

              {/* Android Onboarding Instructions */}
              {activeTab === "android" && (
                <div className="space-y-2.5 animate-ui-fade">
                  {deferredPrompt && !installSuccess && (
                    <button
                      type="button"
                      onClick={handleNativeInstall}
                      className="w-full py-3 px-4 rounded-2xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-accent-contrast)] text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-[var(--color-accent)]/25 emil-press"
                    >
                      <Download className="w-4 h-4 stroke-[2.5]" />
                      <span>Instalar Aplicativo Agora (1 Toque)</span>
                    </button>
                  )}

                  {installSuccess ? (
                    <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-center space-y-1">
                      <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto">
                        <Check className="w-5 h-5 stroke-[3]" />
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        Instalação solicitada com sucesso!
                      </p>
                      <p className="text-[11px] text-[var(--color-text-secondary)]">
                        Confirme a adição do Hinário à sua tela inicial.
                      </p>
                    </div>
                  ) : (
                    <>
                      {deferredPrompt && (
                        <p className="text-[11px] text-[var(--color-text-secondary)] text-center font-semibold pt-0.5">
                          Ou instale manualmente em 3 passos:
                        </p>
                      )}

                      <div className="flex items-start gap-3 p-3 rounded-2xl bg-[var(--color-bg-subtle)] border border-[var(--color-border-subtle)]">
                        <div className="w-8 h-8 rounded-xl bg-[var(--color-accent)]/15 text-[var(--color-accent)] flex items-center justify-center shrink-0 mt-0.5">
                          <MoreVertical className="w-4 h-4 stroke-[2.4]" />
                        </div>
                        <div>
                          <h3 className="text-xs sm:text-sm font-bold text-[var(--color-text-primary)]">
                            1. Menu do Navegador (⋮)
                          </h3>
                          <p className="text-[11px] sm:text-xs text-[var(--color-text-secondary)] mt-0.5 leading-relaxed">
                            No topo direito do <strong>Google Chrome</strong> ou Samsung Internet, toque no menu de <strong>três pontinhos</strong>.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-2xl bg-[var(--color-bg-subtle)] border border-[var(--color-border-subtle)]">
                        <div className="w-8 h-8 rounded-xl bg-[var(--color-accent)]/15 text-[var(--color-accent)] flex items-center justify-center shrink-0 mt-0.5">
                          <Download className="w-4 h-4 stroke-[2.4]" />
                        </div>
                        <div>
                          <h3 className="text-xs sm:text-sm font-bold text-[var(--color-text-primary)]">
                            2. "Instalar aplicativo"
                          </h3>
                          <p className="text-[11px] sm:text-xs text-[var(--color-text-secondary)] mt-0.5 leading-relaxed">
                            Toque em <strong>"Instalar aplicativo"</strong> ou <em>"Adicionar à tela inicial"</em>.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-2xl bg-[var(--color-bg-subtle)] border border-[var(--color-border-subtle)]">
                        <div className="w-8 h-8 rounded-xl bg-[var(--color-accent)]/15 text-[var(--color-accent)] flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-4 h-4 stroke-[2.5]" />
                        </div>
                        <div>
                          <h3 className="text-xs sm:text-sm font-bold text-[var(--color-text-primary)]">
                            3. Confirme em "Instalar"
                          </h3>
                          <p className="text-[11px] sm:text-xs text-[var(--color-text-secondary)] mt-0.5 leading-relaxed">
                            Toque em <strong>Instalar</strong>. Em instantes o app estará disponível no seu aparelho!
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Desktop / Laptop Instructions */}
              {activeTab === "desktop" && (
                <div className="space-y-2.5 animate-ui-fade">
                  {deferredPrompt && (
                    <button
                      type="button"
                      onClick={handleNativeInstall}
                      className="w-full py-3 px-4 rounded-2xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-accent-contrast)] text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-[var(--color-accent)]/25 emil-press"
                    >
                      <Download className="w-4 h-4 stroke-[2.5]" />
                      <span>Instalar no Computador (1 Clique)</span>
                    </button>
                  )}

                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-[var(--color-bg-subtle)] border border-[var(--color-border-subtle)]">
                    <div className="w-8 h-8 rounded-xl bg-[var(--color-accent)]/15 text-[var(--color-accent)] flex items-center justify-center shrink-0 mt-0.5">
                      <Laptop className="w-4 h-4 stroke-[2.4]" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-[var(--color-text-primary)]">
                        1. Ícone na Barra de Endereços
                      </h3>
                      <p className="text-[11px] sm:text-xs text-[var(--color-text-secondary)] mt-0.5 leading-relaxed">
                        No Chrome, Edge ou Brave, localize o ícone de instalação (⤓ ou ⊕) no lado direito da barra de endereço URL.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-[var(--color-bg-subtle)] border border-[var(--color-border-subtle)]">
                    <div className="w-8 h-8 rounded-xl bg-[var(--color-accent)]/15 text-[var(--color-accent)] flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-[var(--color-text-primary)]">
                        2. Confirme a Instalação
                      </h3>
                      <p className="text-[11px] sm:text-xs text-[var(--color-text-secondary)] mt-0.5 leading-relaxed">
                        Clique em <strong>Instalar</strong> para abrir o Hinário em uma janela dedicada e limpa sem as abas do navegador.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Value Proposition Micro Badges */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[var(--color-border-subtle)]">
                <div className="flex flex-col items-center text-center p-2 rounded-xl bg-[var(--color-bg-subtle)]">
                  <WifiOff className="w-4 h-4 text-[var(--color-accent)] mb-1 shrink-0" />
                  <span className="text-[10px] sm:text-[11px] font-bold text-[var(--color-text-primary)] leading-tight">
                    100% Offline
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-[var(--color-text-secondary)] mt-0.5">
                    Sem sinal/Wi-Fi
                  </span>
                </div>
                <div className="flex flex-col items-center text-center p-2 rounded-xl bg-[var(--color-bg-subtle)]">
                  <Maximize2 className="w-4 h-4 text-[var(--color-accent)] mb-1 shrink-0" />
                  <span className="text-[10px] sm:text-[11px] font-bold text-[var(--color-text-primary)] leading-tight">
                    Tela Cheia
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-[var(--color-text-secondary)] mt-0.5">
                    Modo palco limpo
                  </span>
                </div>
                <div className="flex flex-col items-center text-center p-2 rounded-xl bg-[var(--color-bg-subtle)]">
                  <Sparkles className="w-4 h-4 text-[var(--color-accent)] mb-1 shrink-0" />
                  <span className="text-[10px] sm:text-[11px] font-bold text-[var(--color-text-primary)] leading-tight">
                    Instantâneo
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-[var(--color-text-secondary)] mt-0.5">
                    1 toque na tela
                  </span>
                </div>
              </div>

              {/* Dismiss / Action button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full h-10 sm:h-11 rounded-full bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-accent-contrast)] text-xs sm:text-sm font-bold transition-all shadow-md shadow-[var(--color-accent)]/20 emil-press"
                >
                  Entendido, vou instalar
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
