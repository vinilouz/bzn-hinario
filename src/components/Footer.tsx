import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-page)]/85 backdrop-blur-md pt-6 pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))] sm:pb-[max(1.5rem,calc(env(safe-area-inset-bottom,0px)+1rem))] px-4 mt-auto transition-colors duration-150">
      <div className="max-w-xl mx-auto flex flex-col items-center text-center gap-2.5">
        <blockquote className="space-y-1">
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] italic leading-relaxed">
            “Cantem salmos, hinos e canções espirituais; louvem a Deus com gratidão no coração.”
          </p>
          <cite className="block text-[11px] font-semibold text-[var(--color-accent)] not-italic tracking-wide">
            Colossenses 3:16 • NTLH
          </cite>
        </blockquote>
        <a
          href="https://louzlabs.com.br"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-[var(--color-text-secondary)]/50 hover:text-[var(--color-text-secondary)] transition-colors tracking-wide font-mono mt-0.5"
        >
          louzlabs.com.br
        </a>
      </div>
    </footer>
  );
};
