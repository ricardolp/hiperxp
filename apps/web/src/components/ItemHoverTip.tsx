import { useEffect, useId, useState, type ReactNode } from "react";
import {
  databaseItemIconSrc,
  getDatabaseItem,
  getItemDescription,
} from "../lib/database";

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
  const [failed, setFailed] = useState(false);
  const item = getDatabaseItem(itemId);
  const description = getItemDescription(itemId);
  const name = item?.name_pt_br ?? `Item #${itemId}`;

  useEffect(() => {
    setFailed(false);
  }, [itemId]);

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
            <span className="item-tip-icon" aria-hidden>
              {!failed ? (
                <img
                  src={databaseItemIconSrc(itemId)}
                  alt=""
                  onError={() => setFailed(true)}
                />
              ) : (
                <span>◇</span>
              )}
            </span>
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
