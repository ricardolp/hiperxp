export type CoverageStatus = "partial" | "reviewed" | "unknown";
export type ReviewStatus =
  | "pending"
  | "verified_br"
  | "foreign_reference"
  | "disputed"
  | "obsolete";
export type DataOrigin =
  | "client_extracted"
  | "official_published"
  | "community_observed"
  | "third_party"
  | "synthetic";
export type ProbabilityStatus =
  | "confirmed_for_build"
  | "client_declared_unverified_server"
  | "estimated"
  | "unknown"
  | "hypothetical";
export type PointCategory =
  | "chest"
  | "challenge"
  | "collectible"
  | "daily_resource"
  | "npc"
  | "teleport"
  | "quest_objective";
export type ResetPolicy = "permanent" | "daily" | "manual";

export type AffineTransform = {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
};

export type MapFixture = {
  id: string;
  slug: string;
  name_pt_br: string;
  aliases: string[];
  coverage_status: CoverageStatus;
  width: number;
  height: number;
  /** Public URL for the map image (webp/png/svg). */
  asset?: string;
  /** Game coords (x,y) -> image (u,v) */
  transform: AffineTransform;
  notice: string;
  synthetic: boolean;
  origin?: DataOrigin;
  source_url?: string;
  points: MapPointFixture[];
};

export type MapPointFixture = {
  id: string;
  name: string;
  aliases: string[];
  category: PointCategory;
  x: number;
  y: number;
  altitude: number | null;
  zone: string | null;
  reset_policy: ResetPolicy;
  tip: string | null;
  access_conditions: string | null;
  review_status: ReviewStatus;
  origin: DataOrigin;
  type_label?: string | null;
  /** Discrete map icon key, e.g. chest | glint | challenge */
  icon_key?: string;
  /** Public URL for the marker icon image */
  icon?: string;
  source_point_id?: number | string;
};

export type ItemFixture = {
  id: string;
  name_pt_br: string;
  aliases: string[];
  /** Flavor/tooltip text from game or community source (optional). */
  description_pt_br?: string;
};

export type DropReward = {
  item_id: string;
  quantity: number;
};

export type GuaranteedEntry = {
  id: string;
  order: number;
  rewards: DropReward[];
};

export type WeightedEntry = {
  id: string;
  order: number;
  weight: number;
  rewards: DropReward[];
};

export type BernoulliEntry = {
  id: string;
  order: number;
  numerator: number;
  denominator: number;
  rewards: DropReward[];
};

export type DropGroup =
  | {
      id: string;
      order: number;
      type: "guaranteed";
      entries: GuaranteedEntry[];
    }
  | {
      id: string;
      order: number;
      type: "exclusive_weighted";
      rolls: number;
      weight_kind: "declared_probability" | "relative_weights";
      probability_denominator?: number;
      entries: WeightedEntry[];
    }
  | {
      id: string;
      order: number;
      type: "independent_bernoulli";
      rolls: number;
      entries: BernoulliEntry[];
    };

export type DropTableFixture = {
  schema_version: number;
  synthetic: boolean;
  publication_allowed: boolean;
  notice: string;
  id: string;
  slug: string;
  name_pt_br: string;
  revision: string;
  model_version: string;
  probability_status: ProbabilityStatus;
  game_build_id: string | null;
  groups: DropGroup[];
};

export type ReleaseFixture = {
  id: string;
  schema_version: number;
  status: "draft" | "active";
  synthetic: boolean;
  created_at: string;
  notice: string;
  maps: string[];
  drop_tables: string[];
  quest_catalogs?: string[];
};

export type QuestKind = "world_quest" | "journey" | "anecdote" | "daily";

export type QuestCoord = {
  x: number;
  y: number;
  altitude: number | null;
};

export type QuestStepFixture = {
  id: string;
  order: number;
  title_pt_br: string;
  instruction_pt_br: string;
  npc: string | null;
  coords: QuestCoord[];
  dialog_hint: string | null;
  notes: string | null;
};

export type QuestGuideFixture = {
  id: string;
  slug: string;
  map_slug: string;
  kind: QuestKind;
  order: number;
  name_pt_br: string;
  aliases: string[];
  /** Short blurb for listings / home cards. Falls back to summary. */
  excerpt_pt_br?: string | null;
  summary_pt_br: string | null;
  prerequisite_pt_br: string | null;
  rewards_pt_br: string | null;
  /** ISO date for blog-style ordering when known (Trivia publish date). */
  published_at?: string | null;
  coverage_status: CoverageStatus;
  review_status: ReviewStatus;
  origin: DataOrigin;
  source_url: string;
  source_file?: string | null;
  content_hash?: string;
  notice: string;
  steps: QuestStepFixture[];
};

export type QuestCatalogFixture = {
  schema_version: number;
  id: string;
  map_slug: string;
  name_pt_br?: string;
  generated_at: string;
  synthetic: boolean;
  origin: DataOrigin;
  review_status: ReviewStatus;
  notice: string;
  sources: string[];
  quests: QuestGuideFixture[];
};

/** Apply affine transform: u = a*x + b*y + c; v = d*x + e*y + f */
export function gameToImage(
  transform: AffineTransform,
  x: number,
  y: number,
): { u: number; v: number } {
  return {
    u: transform.a * x + transform.b * y + transform.c,
    v: transform.d * x + transform.e * y + transform.f,
  };
}

/** Inverse when determinant is non-zero */
export function imageToGame(
  transform: AffineTransform,
  u: number,
  v: number,
): { x: number; y: number } | null {
  const { a, b, c, d, e, f } = transform;
  const det = a * e - b * d;
  if (det === 0) return null;
  const u0 = u - c;
  const v0 = v - f;
  return {
    x: (e * u0 - b * v0) / det,
    y: (-d * u0 + a * v0) / det,
  };
}

export function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}
