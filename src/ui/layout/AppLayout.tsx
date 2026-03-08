/**
 * iOS-style application layout.
 *
 * Clean three-panel layout with frosted glass toolbar,
 * scrollable sidebar, and full-bleed viewport.
 */

import { type ReactNode } from 'react';

interface AppLayoutProps {
  sidebar: ReactNode;
  viewport: ReactNode;
  toolbar: ReactNode;
}

export function AppLayout({ sidebar, viewport, toolbar }: AppLayoutProps) {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-bg-primary">
      {/* Top toolbar — frosted glass */}
      <header
        className="flex h-12 shrink-0 items-center border-b border-border px-4"
        style={{ backgroundColor: 'var(--color-bg-secondary)' }}
      >
        {toolbar}
      </header>

      {/* Main content area */}
      <div className="flex min-h-0 flex-1">
        {/* Left sidebar — control panels with top padding */}
        <aside className="flex w-[300px] shrink-0 flex-col overflow-y-auto border-r border-border bg-bg-panel pt-1.5 pb-4">
          {sidebar}
        </aside>

        {/* Center viewport */}
        <main className="relative flex-1 bg-bg-primary">{viewport}</main>
      </div>
    </div>
  );
}
