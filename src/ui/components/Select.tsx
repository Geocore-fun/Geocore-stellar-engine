/**
 * Custom select — a button that opens a listbox (the WAI-ARIA "select-only
 * combobox" pattern).
 *
 * Why not a native <select>: Chromium on Windows draws its popup with system
 * colours, so the app's light text landed on a white list. This one matches the
 * dark UI everywhere and behaves the same in every browser.
 *
 * Accessibility: focus never leaves the trigger; the highlighted option is
 * announced through aria-activedescendant.
 *   Closed:  Enter / Space / ↓ / ↑ open; Home / End open at the ends;
 *            typing a letter opens at the first match.
 *   Open:    ↑ ↓ move, Home / End jump, PageUp / PageDown move by 10,
 *            Enter / Space choose, Esc closes without changing,
 *            Tab closes, typing jumps to a matching option.
 * The list is rendered in a portal (the sidebar scrolls and would clip it),
 * flips above the trigger near the bottom of the window, and scrolls inside
 * itself when it is taller than the space available.
 */

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';

export interface SelectOption<T extends string | number> {
  value: T;
  label: string;
  /** Short secondary text shown on the right of the option. */
  hint?: string;
  /** Shown but not choosable. */
  disabled?: boolean;
  /** Why it is disabled; used as the option's description. */
  disabledReason?: string;
}

interface SelectProps<T extends string | number> {
  value: T;
  options: readonly SelectOption<T>[];
  onChange: (value: T) => void;
  /** Id of the visible label element. Either this or `ariaLabel` is required. */
  labelledBy?: string;
  ariaLabel?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
  className?: string;
  /** Tooltip on the trigger. */
  title?: string;
}

/** Gap between trigger and list, and the margin kept from the window edge. */
const GAP = 4;
const EDGE_MARGIN = 8;
const MAX_LIST_HEIGHT = 300;
const TYPEAHEAD_RESET_MS = 600;

interface Placement {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  side: 'bottom' | 'top';
}

export function Select<T extends string | number>({
  value,
  options,
  onChange,
  labelledBy,
  ariaLabel,
  disabled = false,
  size = 'md',
  className = '',
  title,
}: SelectProps<T>) {
  const baseId = useId();
  const listId = `${baseId}-list`;
  const triggerId = `${baseId}-trigger`;
  const optionId = (i: number) => `${baseId}-opt-${i}`;

  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [placement, setPlacement] = useState<Placement | null>(null);
  const typeahead = useRef({ buffer: '', timer: 0 });

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  const isEnabled = useCallback((i: number) => i >= 0 && !options[i]?.disabled, [options]);

  /** Nearest enabled index from `start` moving by `step`, or -1. */
  const findEnabled = useCallback(
    (start: number, step: 1 | -1): number => {
      for (let i = start; i >= 0 && i < options.length; i += step) {
        if (isEnabled(i)) return i;
      }
      return -1;
    },
    [options.length, isEnabled],
  );

  const firstEnabled = useCallback(() => findEnabled(0, 1), [findEnabled]);
  const lastEnabled = useCallback(
    () => findEnabled(options.length - 1, -1),
    [findEnabled, options.length],
  );

  const openList = useCallback(
    (initial?: number) => {
      if (disabled || options.length === 0) return;
      const start =
        initial !== undefined && initial >= 0
          ? initial
          : isEnabled(selectedIndex)
            ? selectedIndex
            : firstEnabled();
      setActiveIndex(start);
      setOpen(true);
    },
    [disabled, options.length, isEnabled, selectedIndex, firstEnabled],
  );

  const close = useCallback(() => {
    setOpen(false);
    setPlacement(null);
  }, []);

  const choose = useCallback(
    (i: number) => {
      if (!isEnabled(i)) return;
      if (options[i].value !== value) onChange(options[i].value);
      close();
      triggerRef.current?.focus();
    },
    [isEnabled, options, value, onChange, close],
  );

  /** Type-ahead: match labels by prefix; repeating one letter cycles through matches. */
  const matchTypeahead = useCallback(
    (char: string, from: number): number => {
      const ta = typeahead.current;
      window.clearTimeout(ta.timer);
      ta.timer = window.setTimeout(() => {
        ta.buffer = '';
      }, TYPEAHEAD_RESET_MS);

      const lower = char.toLowerCase();
      const repeating = ta.buffer.length > 0 && [...ta.buffer].every((c) => c === lower);
      ta.buffer += lower;
      const query = repeating ? lower : ta.buffer;

      const n = options.length;
      // A fresh multi-letter query may still match the current option; a single
      // letter (or a repeat) moves on to the next match.
      const offset = query.length > 1 && !repeating ? 0 : 1;
      for (let k = 0; k < n; k++) {
        const i = (Math.max(from, 0) + offset + k) % n;
        if (isEnabled(i) && options[i].label.toLowerCase().startsWith(query)) return i;
      }
      return -1;
    },
    [options, isEnabled],
  );

  useEffect(() => {
    const ta = typeahead.current;
    return () => window.clearTimeout(ta.timer);
  }, []);

  // Position the list against the trigger, flipping up when there is more room above.
  const updatePlacement = useCallback(() => {
    const trigger = triggerRef.current;
    const list = listRef.current;
    if (!trigger || !list) return;

    const rect = trigger.getBoundingClientRect();
    const viewportH = window.innerHeight;
    const viewportW = window.innerWidth;
    const natural = Math.min(list.scrollHeight, MAX_LIST_HEIGHT);
    const below = viewportH - rect.bottom - GAP - EDGE_MARGIN;
    const above = rect.top - GAP - EDGE_MARGIN;
    const side: Placement['side'] = natural <= below || below >= above ? 'bottom' : 'top';
    const maxHeight = Math.max(80, Math.min(MAX_LIST_HEIGHT, side === 'bottom' ? below : above));
    const height = Math.min(natural, maxHeight);

    // At least as wide as the trigger; wider if an option needs it, within reason.
    const width = Math.max(rect.width, Math.min(list.scrollWidth, 360));
    const left = Math.min(Math.max(EDGE_MARGIN, rect.left), viewportW - width - EDGE_MARGIN);
    const top = side === 'bottom' ? rect.bottom + GAP : rect.top - GAP - height;

    setPlacement((prev) =>
      prev &&
      prev.top === top &&
      prev.left === left &&
      prev.width === width &&
      prev.maxHeight === maxHeight &&
      prev.side === side
        ? prev
        : { top, left, width, maxHeight, side },
    );
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePlacement();
    // Any scroll (the sidebar, the page) or resize moves the trigger.
    window.addEventListener('resize', updatePlacement);
    window.addEventListener('scroll', updatePlacement, true);
    return () => {
      window.removeEventListener('resize', updatePlacement);
      window.removeEventListener('scroll', updatePlacement, true);
    };
  }, [open, updatePlacement]);

  // Keep the highlighted option in view inside a scrolling list.
  useLayoutEffect(() => {
    if (!open || activeIndex < 0 || !placement) return;
    document.getElementById(`${baseId}-opt-${activeIndex}`)?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex, placement, baseId]);

  // Click outside closes (focus stays where the user clicked).
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || listRef.current?.contains(target)) return;
      close();
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [open, close]);

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const isChar = e.key.length === 1 && e.key !== ' ' && !e.ctrlKey && !e.metaKey && !e.altKey;
    // Letters typed here are type-ahead, not the app's single-key shortcuts
    // (R randomises the seed, 1-9 load presets...).
    if (isChar) e.stopPropagation();

    if (!open) {
      switch (e.key) {
        case 'Enter':
        case ' ':
        case 'ArrowDown':
        case 'ArrowUp':
          e.preventDefault();
          openList();
          return;
        case 'Home':
          e.preventDefault();
          openList(firstEnabled());
          return;
        case 'End':
          e.preventDefault();
          openList(lastEnabled());
          return;
        default:
          if (isChar) {
            e.preventDefault();
            const match = matchTypeahead(e.key, selectedIndex);
            openList(match >= 0 ? match : undefined);
          }
          return;
      }
    }

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        if (e.altKey) {
          return;
        }
        const next = findEnabled(activeIndex + 1, 1);
        if (next >= 0) setActiveIndex(next);
        return;
      }
      case 'ArrowUp': {
        e.preventDefault();
        if (e.altKey) {
          choose(activeIndex);
          return;
        }
        const prev = findEnabled(activeIndex - 1, -1);
        if (prev >= 0) setActiveIndex(prev);
        return;
      }
      case 'Home':
        e.preventDefault();
        setActiveIndex(firstEnabled());
        return;
      case 'End':
        e.preventDefault();
        setActiveIndex(lastEnabled());
        return;
      case 'PageDown': {
        e.preventDefault();
        const target = Math.min(options.length - 1, activeIndex + 10);
        const next = findEnabled(target, -1);
        if (next >= 0) setActiveIndex(next);
        return;
      }
      case 'PageUp': {
        e.preventDefault();
        const target = Math.max(0, activeIndex - 10);
        const prev = findEnabled(target, 1);
        if (prev >= 0) setActiveIndex(prev);
        return;
      }
      case 'Enter':
      case ' ':
        e.preventDefault();
        choose(activeIndex);
        return;
      case 'Escape':
        e.preventDefault();
        // Stop here: an Escape that closes a list must not also close a dialog.
        e.stopPropagation();
        close();
        return;
      case 'Tab':
        close();
        return;
      default:
        if (isChar) {
          e.preventDefault();
          const match = matchTypeahead(e.key, activeIndex);
          if (match >= 0) setActiveIndex(match);
        }
    }
  };

  const activeOption = open && activeIndex >= 0 ? optionId(activeIndex) : undefined;

  return (
    <>
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={activeOption}
        aria-labelledby={labelledBy ? `${labelledBy} ${triggerId}` : undefined}
        aria-label={labelledBy ? undefined : ariaLabel}
        disabled={disabled}
        title={title}
        onClick={() => (open ? close() : openList())}
        onKeyDown={handleKeyDown}
        className={`select-trigger select-trigger-${size} ${className}`}
      >
        <span className="truncate">{selected?.label ?? 'Choose…'}</span>
        <svg
          width="10"
          height="6"
          viewBox="0 0 10 6"
          fill="none"
          aria-hidden="true"
          className="shrink-0 text-text-secondary transition-transform duration-150"
          style={{ transform: open ? 'rotate(180deg)' : undefined }}
        >
          <path
            d="M1 1L5 5L9 1"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open &&
        createPortal(
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-labelledby={labelledBy}
            aria-label={labelledBy ? undefined : ariaLabel}
            tabIndex={-1}
            data-placement={placement?.side ?? 'bottom'}
            className="select-listbox"
            style={{
              top: placement?.top ?? -9999,
              left: placement?.left ?? -9999,
              minWidth: placement?.width,
              maxHeight: placement?.maxHeight ?? MAX_LIST_HEIGHT,
              // Measured first, shown once placed: no flash in the wrong spot.
              visibility: placement ? 'visible' : 'hidden',
            }}
            // Keep focus (and the activedescendant) on the trigger while clicking.
            onMouseDown={(e) => e.preventDefault()}
          >
            {options.map((option, i) => (
              <li
                key={String(option.value)}
                id={optionId(i)}
                role="option"
                aria-selected={i === selectedIndex}
                aria-disabled={option.disabled || undefined}
                aria-description={option.disabled ? option.disabledReason : undefined}
                data-active={i === activeIndex}
                title={option.disabled ? option.disabledReason : undefined}
                className="select-option"
                onMouseMove={() => {
                  if (activeIndex !== i) setActiveIndex(i);
                }}
                onClick={() => choose(i)}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  aria-hidden="true"
                  className="shrink-0 text-accent"
                  style={{ opacity: i === selectedIndex ? 1 : 0 }}
                >
                  <path
                    d="M2.5 6.2L5 8.5L9.5 3.5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="whitespace-nowrap">{option.label}</span>
                {option.hint && <span className="select-option-hint">{option.hint}</span>}
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </>
  );
}
