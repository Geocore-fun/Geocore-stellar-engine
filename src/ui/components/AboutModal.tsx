/**
 * About modal popup with app info and links.
 */

import { CubeIcon, ExternalLinkIcon, GitHubIcon, GlobeIcon } from '@/ui/icons';
import { Modal } from './Modal';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Open the "Use in Geocore" guide. */
  onOpenGeocoreGuide?: () => void;
}

export function AboutModal({ isOpen, onClose, onOpenGeocoreGuide }: AboutModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Geocore Stellar Engine"
      subtitle="v1.0.0"
      leading={
        <img
          src="/images/Logo.png"
          alt=""
          className="h-10 w-10 rounded-xl shadow-lg shadow-accent/20"
        />
      }
    >
      {/* Content */}
      <div className="px-5 py-4">
        <p className="text-[13px] leading-relaxed text-text-secondary">
          A GPU-accelerated procedural skybox engine for low-earth orbit simulation. Generate
          photorealistic space backgrounds with stars, nebulae, Milky Way, constellations, and sun
          effects — then export as cubemap PNGs or HDR for Unity and other game engines.
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

        <p className="mt-3 text-[13px] leading-relaxed text-text-secondary">
          Geocore Pro players on Windows can use any sky made here as the game&rsquo;s backdrop.{' '}
          {onOpenGeocoreGuide && (
            <button
              type="button"
              onClick={onOpenGeocoreGuide}
              className="focus-ring rounded font-medium text-accent transition-colors hover:text-accent-hover"
            >
              How to use it in Geocore
            </button>
          )}
        </p>
      </div>

      {/* Links */}
      <div className="border-t border-white/5 px-5 py-4">
        <div className="flex flex-col gap-2">
          <LinkRow icon={<GlobeIcon />} label="anahatmudgal.com" href="https://anahatmudgal.com" />
          <LinkRow
            icon={<GitHubIcon />}
            label="github.com/anahatm"
            href="https://github.com/anahatm"
          />
          <LinkRow icon={<CubeIcon />} label="geocore.fun" href="https://geocore.fun" />
          <LinkRow
            icon={<GitHubIcon />}
            label="Geocore Technologies"
            href="https://github.com/Geocore-fun"
          />
          <LinkRow
            icon={<ExternalLinkIcon />}
            label="Project Page"
            href="https://www.anahatmudgal.com/development/geocore-stellar-engine"
          />
          <LinkRow
            icon={<GitHubIcon />}
            label="Source Code"
            href="https://github.com/Geocore-fun/geocore-stellar-engine"
          />
        </div>
      </div>
    </Modal>
  );
}

function LinkRow({ icon, label, href }: { icon: React.ReactNode; label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="focus-ring flex items-center gap-3 rounded-lg px-2 py-2 text-text-secondary transition-all hover:bg-white/5 hover:text-text-primary"
    >
      <span className="text-text-muted">{icon}</span>
      <span className="text-[12px]">{label}</span>
      <ExternalLinkIcon className="ml-auto text-text-muted opacity-50" />
    </a>
  );
}
