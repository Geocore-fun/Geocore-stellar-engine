/**
 * "Use in Geocore" — how a Geocore Pro player puts a sky made here into the
 * game, with a one-click export at the right format and size.
 *
 * Every limit shown comes from GEOCORE_SKYBOX, the single source for what the
 * game accepts.
 */

import { formatMiB, GEOCORE_SKYBOX } from '@/export/geocoreTarget';
import { useAppStore } from '@/state';
import { ExternalLinkIcon } from '@/ui/icons';
import type { ReactNode } from 'react';
import { Modal } from './Modal';

interface GeocoreGuideProps {
  isOpen: boolean;
  onClose: () => void;
  /** Export a cross-layout PNG at the given face size for Geocore. */
  onExportForGeocore: (resolution: number) => void;
}

const { resolution, fallbackResolution, maxFaceSize, maxFileBytes, supportUrl } = GEOCORE_SKYBOX;

export function GeocoreGuide({ isOpen, onClose, onExportForGeocore }: GeocoreGuideProps) {
  const isExporting = useAppStore((s) => s.isExporting);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Use your sky in Geocore"
      subtitle="Geocore for Windows · Pro"
      widthClass="max-w-lg"
    >
      <div className="px-5 py-4 text-[13px] leading-relaxed text-text-secondary">
        <p>
          Pro players on Geocore for Windows can replace the sky behind the globe with one made
          here. The <strong className="font-medium text-text-primary">Orbit</strong> presets (Orbit
          Clean, Quiet Orbit, Orbital Sunrise…) are tuned for it.
        </p>

        <ol className="mt-4 flex flex-col gap-3">
          <Step n={1}>
            Export the sky as <Em>Cross Layout PNG</Em> at{' '}
            <Em>
              {resolution} × {resolution}
            </Em>
            . The button below does both and saves{' '}
            <code className="rounded bg-white/5 px-1 font-mono text-[12px] text-text-primary">
              skybox_cross_{resolution}.png
            </code>
            .
          </Step>
          <Step n={2}>
            In Geocore for Windows, signed in with Pro, open <Em>Settings ▸ Custom skybox</Em>.
          </Step>
          <Step n={3}>
            Paste the file&rsquo;s full path. In File Explorer, Shift + right-click the PNG ▸{' '}
            <Em>Copy as path</Em> gives you one that works as is, quotes included.
          </Step>
          <Step n={4}>
            Press <Em>Import skybox</Em>. <Em>Reset skybox</Em> brings back the default sky.
          </Step>
        </ol>

        <div className="mt-4 rounded-lg bg-white/[0.03] px-3.5 py-3 text-[12px] ring-1 ring-white/5">
          <p>
            <span className="font-medium text-text-primary">File too large?</span> Geocore accepts
            up to {formatMiB(maxFileBytes)}. Busy skies with nebulae and many stars compress poorly,
            so export at {fallbackResolution} instead. Faces above {maxFaceSize} px are refused.
          </p>
          <p className="mt-2">
            The imported sky lasts until Geocore closes; it is not saved between sessions.
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={isExporting}
            onClick={() => onExportForGeocore(resolution)}
            className="focus-ring rounded-lg bg-accent px-4 py-2 text-[13px] font-semibold text-white shadow-lg transition-all hover:bg-accent-hover active:scale-[0.98] disabled:opacity-50"
          >
            Export for Geocore ({resolution})
          </button>
          <button
            type="button"
            disabled={isExporting}
            onClick={() => onExportForGeocore(fallbackResolution)}
            className="focus-ring rounded-lg bg-white/5 px-3.5 py-2 text-[12px] font-medium text-text-secondary ring-1 ring-white/8 transition-all hover:bg-white/10 hover:text-text-primary active:scale-[0.98] disabled:opacity-50"
          >
            Smaller file ({fallbackResolution})
          </button>
        </div>

        <a
          href={supportUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="focus-ring mt-4 inline-flex items-center gap-1.5 rounded text-[12px] font-medium text-accent transition-colors hover:text-accent-hover"
        >
          Geocore help and the game&rsquo;s import messages
          <ExternalLinkIcon />
        </a>
      </div>
    </Modal>
  );
}

function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span
        aria-hidden="true"
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-[11px] font-semibold text-accent"
      >
        {n}
      </span>
      <span>{children}</span>
    </li>
  );
}

function Em({ children }: { children: ReactNode }) {
  return <strong className="font-medium text-text-primary">{children}</strong>;
}
