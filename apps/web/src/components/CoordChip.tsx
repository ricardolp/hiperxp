import { useEffect, useState } from "react";
import type { QuestCoord } from "@hiperxp/contracts";

export function formatCoordDisplay(c: QuestCoord): string {
  return c.altitude == null
    ? `${c.x}, ${c.y}`
    : `${c.x}, ${c.y} (${c.altitude})`;
}

/** Clipboard text matching map popup / in-game paste habit. */
export function formatCoordCopy(c: QuestCoord): string {
  return c.altitude == null
    ? `${c.x}, ${c.y}`
    : `${c.x}, ${c.y}, ${c.altitude}`;
}

export function coordKey(c: QuestCoord): string {
  return `${c.x},${c.y},${c.altitude ?? ""}`;
}

type CoordChipProps = {
  coord: QuestCoord;
  className?: string;
};

export function CoordChip({ coord, className }: CoordChipProps) {
  const [copied, setCopied] = useState(false);
  const display = formatCoordDisplay(coord);
  const copyText = formatCoordCopy(coord);

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 1400);
    return () => window.clearTimeout(id);
  }, [copied]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      className={`qg-coord-chip${className ? ` ${className}` : ""}${copied ? " is-copied" : ""}`}
      onClick={() => void handleCopy()}
      title={copied ? "Copiado" : `Copiar ${display}`}
      aria-label={copied ? `Coordenada ${display} copiada` : `Copiar coordenada ${display}`}
    >
      <span className="qg-coord-chip-value">{display}</span>
      <span className="qg-coord-chip-action" aria-hidden>
        {copied ? (
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path
              d="M3.5 8.5 6.5 11.5 12.5 4.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <rect
              x="5.5"
              y="5.5"
              width="8"
              height="8"
              rx="1.5"
              stroke="currentColor"
              strokeWidth="1.4"
            />
            <path
              d="M10.5 5.5V4A1.5 1.5 0 0 0 9 2.5H4A1.5 1.5 0 0 0 2.5 4v5A1.5 1.5 0 0 0 4 10.5h1.5"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
        )}
      </span>
    </button>
  );
}
