import type { ReactNode } from "react";
import {
  gameItemId,
  itemDescription,
  itemIconSrc,
  itemName,
} from "../lib/data";

type ItemTooltipProps = {
  itemId: string;
  quantity?: number;
  children: ReactNode;
  className?: string;
  /** Prefer opening above the trigger (reward icons) or below (table rows). */
  placement?: "above" | "below";
};

function isEffectLine(line: string): boolean {
  const t = line.trim().toLowerCase();
  return (
    t.startsWith("efeito") ||
    t.startsWith("requer") ||
    t.startsWith("atributo") ||
    /^valor de\b/.test(t) ||
    /\+\d/.test(t)
  );
}

export function ItemTooltip({
  itemId,
  quantity,
  children,
  className,
  placement = "above",
}: ItemTooltipProps) {
  const name = itemName(itemId);
  const id = gameItemId(itemId) ?? itemId;
  const description = itemDescription(itemId);
  const icon = itemIconSrc(itemId);
  const lines = description
    ? description.split("\n").map((l) => l.trim()).filter(Boolean)
    : [];

  return (
    <span
      className={[
        "item-tip",
        placement === "below" ? "item-tip--below" : "item-tip--above",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
      <span className="item-tip-panel" role="tooltip">
        <span className="item-tip-name">{name}</span>
        <span className="item-tip-row">
          {icon ? (
            <img className="item-tip-icon" src={icon} alt="" />
          ) : (
            <span className="item-tip-icon item-tip-icon--empty" aria-hidden>
              ◇
            </span>
          )}
          <span className="item-tip-side">
            <span className="item-tip-id">[{id}]</span>
            {quantity !== undefined ? (
              <span className="item-tip-qty">×{quantity}</span>
            ) : null}
          </span>
        </span>
        {lines.length > 0 ? (
          <span className="item-tip-desc">
            {lines.map((line, index) => (
              <span
                key={`${itemId}-d-${index}`}
                className={
                  isEffectLine(line) ? "item-tip-line item-tip-line--fx" : "item-tip-line"
                }
              >
                {line}
              </span>
            ))}
          </span>
        ) : (
          <span className="item-tip-desc item-tip-desc--muted">
            Sem descrição cadastrada.
          </span>
        )}
      </span>
    </span>
  );
}
