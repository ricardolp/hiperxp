type SkeletonProps = {
  className?: string;
  width?: string | number;
  height?: string | number;
  radius?: string | number;
};

export function Skeleton({
  className,
  width,
  height,
  radius,
}: SkeletonProps) {
  return (
    <span
      className={`sk${className ? ` ${className}` : ""}`}
      style={{
        width,
        height,
        borderRadius: radius,
      }}
      aria-hidden
    />
  );
}

export function DatabaseBrowseSkeleton({
  tab = "itens",
}: {
  tab?: "itens" | "missoes";
}) {
  if (tab === "missoes") {
    return (
      <div className="sk-quest-list" aria-busy="true" aria-label="Carregando">
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className="sk-quest-row">
            <Skeleton className="sk-line" width="58%" height={14} />
            <Skeleton className="sk-line" width="22%" height={12} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="sk-grid" aria-busy="true" aria-label="Carregando">
      {Array.from({ length: 24 }, (_, i) => (
        <div key={i} className="sk-tile">
          <Skeleton className="sk-icon" width={36} height={36} radius={8} />
          <span className="sk-tile-body">
            <Skeleton className="sk-line" width="78%" height={12} />
            <Skeleton className="sk-line" width="36%" height={10} />
          </span>
        </div>
      ))}
    </div>
  );
}

export function DatabaseDetailSkeleton({
  variant = "item",
}: {
  variant?: "item" | "npc" | "quest";
}) {
  return (
    <div className="sk-detail" aria-busy="true" aria-label="Carregando">
      <div className="sk-crumb">
        <Skeleton width={72} height={10} />
        <Skeleton width={10} height={10} radius={999} />
        <Skeleton width={96} height={10} />
        <Skeleton width={10} height={10} radius={999} />
        <Skeleton width={140} height={10} />
      </div>

      <div className="sk-hero">
        <Skeleton className="sk-hero-icon" width={56} height={56} radius={9} />
        <div className="sk-hero-copy">
          <Skeleton width={120} height={10} />
          <Skeleton width="42%" height={22} />
          {variant !== "quest" ? (
            <Skeleton width="70%" height={12} />
          ) : null}
        </div>
      </div>

      {variant === "npc" ? (
        <div className="sk-npc-grid">
          <div className="sk-card">
            <Skeleton width={88} height={14} />
            <Skeleton width="92%" height={12} />
            <Skeleton width="78%" height={12} />
            <div className="sk-chip-row">
              <Skeleton width={72} height={24} radius={999} />
              <Skeleton width={96} height={24} radius={999} />
              <Skeleton width={84} height={24} radius={999} />
            </div>
            <Skeleton width="100%" height={34} radius={8} />
            <Skeleton width="100%" height={34} radius={8} />
            <Skeleton width="100%" height={34} radius={8} />
          </div>
          <div className="sk-card sk-card--forge">
            <Skeleton width={72} height={14} />
            <Skeleton width={311} height={431} radius={4} />
          </div>
        </div>
      ) : (
        <div className="sk-detail-layout">
          <div className="sk-card">
            <Skeleton width={110} height={14} />
            <div className="sk-craft-row">
              <Skeleton width={64} height={64} radius={10} />
              <div className="sk-hero-copy">
                <Skeleton width="55%" height={14} />
                <Skeleton width="80%" height={12} />
                <Skeleton width={72} height={24} radius={6} />
              </div>
            </div>
            <Skeleton width="100%" height={40} radius={9} />
            <Skeleton width="100%" height={40} radius={9} />
            <Skeleton width="100%" height={40} radius={9} />
          </div>
          <div className="sk-card">
            <Skeleton width={88} height={14} />
            <Skeleton width="100%" height={12} />
            <Skeleton width="94%" height={12} />
            <Skeleton width="86%" height={12} />
            <Skeleton width="70%" height={12} />
          </div>
        </div>
      )}
    </div>
  );
}
