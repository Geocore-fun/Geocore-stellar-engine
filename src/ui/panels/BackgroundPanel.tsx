/**
 * Background color control panel.
 */

import { useAppStore } from '@/state';
import type { HexColor } from '@/types';
import { ColorPickerControl, PanelSection } from '@/ui/components';

export function BackgroundPanel() {
  const backgroundColor = useAppStore((s) => s.backgroundColor);
  const setBackgroundColor = useAppStore((s) => s.setBackgroundColor);

  return (
    <PanelSection title="Background" defaultOpen={false}>
      <ColorPickerControl
        label="Color"
        value={backgroundColor}
        onChange={(color) => setBackgroundColor(color as HexColor)}
      />
    </PanelSection>
  );
}
