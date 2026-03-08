/**
 * About modal popup with app info and links.
 */

import { CloseIcon, CubeIcon, ExternalLinkIcon, GitHubIcon, GlobeIcon } from '@/ui/icons';
import { useEffect, useRef } from 'react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Modal */}
      <div
        ref={modalRef}
        className="glass-popover relative mx-4 w-full max-w-sm overflow-hidden rounded-2xl shadow-2xl"
        style={{
          animation: 'fadeInScale 0.2s ease-out',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 px-5 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-[15px] font-bold text-white shadow-lg shadow-accent/20">
              SG
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-text-primary">Skybox Generator</h2>
              <p className="text-[11px] text-text-muted">v1.0.0</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-text-muted transition-all hover:bg-white/10 hover:text-text-primary active:scale-90"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-4">
          <p className="text-[13px] leading-relaxed text-text-secondary">
            A procedural cubemap skybox generator built for game development. Generate stunning
            space backgrounds with customizable stars, nebulae, and sun effects, then export as
            cubemap PNGs for Unity and other game engines.
          </p>

          <p className="mt-3 text-[13px] leading-relaxed text-text-secondary">
            Built for{' '}
            <a
              href="https://geocore.fun"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-accent transition-colors hover:text-accent-hover"
            >
              Geocore
            </a>{' '}
            &mdash; a 3D geography game.
          </p>
        </div>

        {/* Links */}
        <div className="border-t border-white/5 px-5 py-4">
          <div className="flex flex-col gap-2">
            <LinkRow
              icon={<GlobeIcon />}
              label="anahatmudgal.com"
              href="https://anahatmudgal.com"
            />
            <LinkRow
              icon={<GitHubIcon />}
              label="github.com/anahatm"
              href="https://github.com/anahatm"
            />
            <LinkRow icon={<CubeIcon />} label="geocore.fun" href="https://geocore.fun" />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}

function LinkRow({ icon, label, href }: { icon: React.ReactNode; label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-lg px-2 py-2 text-text-secondary transition-all hover:bg-white/5 hover:text-text-primary"
    >
      <span className="text-text-muted">{icon}</span>
      <span className="text-[12px]">{label}</span>
      <ExternalLinkIcon className="ml-auto text-text-muted opacity-50" />
    </a>
  );
}
