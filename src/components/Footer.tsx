import React from "react";
import { Download } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-page)]/85 backdrop-blur-md pt-6 pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))] sm:pb-[max(1.5rem,calc(env(safe-area-inset-bottom,0px)+1rem))] px-4 mt-auto transition-colors duration-150">
      <div className="max-w-xl mx-auto flex flex-col items-center text-center gap-3">
        <blockquote className="space-y-1">
          <p className="text-sm sm:text-base text-[var(--color-text-secondary)] italic leading-relaxed">
            “Cantem salmos, hinos e canções espirituais; louvem a Deus com gratidão no coração.”
          </p>
          <cite className="block text-xs sm:text-sm font-semibold text-[var(--color-accent)] not-italic tracking-wide">
            Colossenses 3:16 • NTLH
          </cite>
        </blockquote>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("open-pwa-install-modal"))}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-bg-subtle)] border border-[var(--color-border-subtle)] text-xs font-semibold text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors emil-press shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Instalar App Offline</span>
          </button>

          <a
            href="https://louzlabs.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[var(--color-text-secondary)]/60 hover:text-[var(--color-text-secondary)] transition-colors tracking-wide font-mono"
          >
            louzlabs.com.br
          </a>
        </div>
      </div>
    </footer>
  );
};
