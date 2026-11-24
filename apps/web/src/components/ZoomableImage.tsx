import { useEffect, useId, useState } from "react";

type ZoomableImageProps = {
  src: string;
  alt: string;
  caption?: string | null;
  className?: string;
};

export function ZoomableImage({
  src,
  alt,
  caption,
  className,
}: ZoomableImageProps) {
  const [open, setOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "+" || e.key === "=") setScale((s) => Math.min(4, s + 0.25));
      if (e.key === "-" || e.key === "_") setScale((s) => Math.max(0.5, s - 0.25));
      if (e.key === "0") setScale(1);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className={`qg-zoom-trigger${className ? ` ${className}` : ""}`}
        onClick={() => {
          setScale(1);
          setOpen(true);
        }}
        aria-label={`Ampliar: ${alt}`}
      >
        <img src={src} alt={alt} loading="lazy" decoding="async" />
        <span className="qg-zoom-badge" aria-hidden>
          Zoom
        </span>
      </button>

      {open ? (
        <div
          className="qg-zoom-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={() => setOpen(false)}
        >
          <div
            className="qg-zoom-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="qg-zoom-toolbar">
              <strong id={titleId}>{alt}</strong>
              <div className="qg-zoom-actions">
                <button
                  type="button"
                  onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
                  aria-label="Diminuir zoom"
                >
                  −
                </button>
                <button
                  type="button"
                  onClick={() => setScale(1)}
                  aria-label="Resetar zoom"
                >
                  {Math.round(scale * 100)}%
                </button>
                <button
                  type="button"
                  onClick={() => setScale((s) => Math.min(4, s + 0.25))}
                  aria-label="Aumentar zoom"
                >
                  +
                </button>
                <button
                  type="button"
                  className="qg-zoom-close"
                  onClick={() => setOpen(false)}
                  aria-label="Fechar"
                >
                  ×
                </button>
              </div>
            </div>
            <div
              className="qg-zoom-stage"
              onWheel={(e) => {
                e.preventDefault();
                const delta = e.deltaY < 0 ? 0.15 : -0.15;
                setScale((s) => Math.min(4, Math.max(0.5, s + delta)));
              }}
            >
              <img
                src={src}
                alt={alt}
                style={{ transform: `scale(${scale})` }}
                draggable={false}
              />
            </div>
            {caption ? <p className="qg-zoom-caption">{caption}</p> : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
