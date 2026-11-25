import { useEffect, useState } from "react";
import { databaseItemIconSources } from "../lib/database";

type ItemIconProps = {
  id: number;
  className?: string;
  fallbackClassName?: string;
  /** Extra sources tried before the default CDN/raw chain (e.g. quest meta). */
  extraSources?: (string | null | undefined)[];
};

/** Loads item PNG with CDN → GitHub raw fallback before showing ◇. */
export function ItemIcon({
  id,
  className,
  fallbackClassName = "db-icon-fallback",
  extraSources,
}: ItemIconProps) {
const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [id]);

  const sources = [
    ...(extraSources ?? []).filter((s): s is string => Boolean(s)),
    ...databaseItemIconSources(id),
  ];
  const unique = [...new Set(sources)];
  const src = unique[index];
  if (!src) {
    return (
      <span className={className} aria-hidden>
        <span className={fallbackClassName}>◇</span>
      </span>
    );
  }

  return (
    <span className={className} aria-hidden>
      <img
        key={src}
        src={src}
        alt=""
        loading="lazy"
        onError={() => setIndex((i) => i + 1)}
      />
    </span>
  );
}
