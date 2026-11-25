import { useId, useState, type ReactNode } from "react";
import { getDatabaseItem, getItemDescription } from "../lib/database";
import { ItemIcon } from "./ItemIcon";

type ItemHoverTipProps = {
  itemId: number;
  children: ReactNode;
  className?: string;
};

export function ItemHoverTip({
  itemId,
  children,
  className,
}: ItemHoverTipProps) {
  const tipId = useId();
  const [open, setOpen] = useState(false);
  const item = getDatabaseItem(itemId);
  const description = getItemDescription(itemId);
  const name = item?.name_pt_br ?? `Item #${itemId}`;

  return (
    <span
      className={`item-tip${className ? ` ${className}` : ""}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open ? (
        <span className="item-tip-panel" role="tooltip" id={tipId}>
          <span className="item-tip-head">
            <ItemIcon id={itemId} className="item-tip-icon" />
            <span className="item-tip-title">{name}</span>
          </span>
          <span className="item-tip-meta">#{itemId}</span>
          {description ? (
            <span className="item-tip-desc">{description}</span>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}
