/**
 * Main application layout.
 *
 * Three-panel layout:
 * - Left: Control panels (collapsible parameter sections)
 * - Center: WebGL viewport (canvas)
 * - Right: Preview / export options (future)
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
      {/* Top toolbar */}
      <header className="flex h-10 shrink-0 items-center border-b border-border bg-bg-secondary px-3">
        {toolbar}
      </header>

      {/* Main content area */}
      <div className="flex min-h-0 flex-1">
        {/* Left sidebar - control panels */}
        <aside className="flex w-72 shrink-0 flex-col overflow-y-auto border-r border-border bg-bg-panel">
          {sidebar}
        </aside>

        {/* Center viewport */}
        <main className="relative flex-1">{viewport}</main>
      </div>
    </div>
  );
}
