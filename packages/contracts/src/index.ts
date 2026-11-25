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
  /** Optional reference screenshot for the step (public URL). */
  image_url?: string | null;
  image_alt?: string | null;
};

/** Structured reward that can link to the database encyclopedia. */
export type QuestRewardRef = {
  /** Display label (pt-BR). */
  label_pt_br: string;
  /** Client item id when known; omit/null for non-item rewards (exp, vitae). */
  item_id?: number | null;
  quantity?: number | null;
  note_pt_br?: string | null;
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
  /** Structured rewards with optional database item links. */
  rewards?: QuestRewardRef[];
  /** Optional hero/cover image for the quest post. */
  cover_image?: string | null;
  /** ISO date for blog-style ordering when known (source publish date). */
  published_at?: string | null;
  coverage_status: CoverageStatus;
  review_status: ReviewStatus;
  origin: DataOrigin;
  source_url: string | null;
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

/** Slim client-extracted item row for the Database encyclopedia. */
export type DatabaseItemEntry = {
  id: number;
  list: number;
  name_pt_br: string;
  has_description?: boolean;
  has_quest_links?: boolean;
  has_recipes?: boolean;
};

/** Slim client-extracted quest row. */
export type DatabaseQuestEntry = {
  id: number;
  name_pt_br: string;
  has_description?: boolean;
  has_rewards?: boolean;
  has_premises?: boolean;
  has_series?: boolean;
};

export type DatabaseQuestItemRef = {
  id: number;
  quantity: number;
  common_item?: boolean;
  probability?: number;
};

export type DatabaseQuestSeries = {
  base: string;
  index: number;
  previous_id: number | null;
  next_id: number | null;
};

export type DatabaseQuestDetail = {
  description_pt_br?: string;
  reward_items?: DatabaseQuestItemRef[];
  premise_items?: DatabaseQuestItemRef[];
  series?: DatabaseQuestSeries;
};

export type DatabaseItemQuestLink = {
  quest_id: number;
  quantity: number;
  probability?: number;
};

export type DatabaseItemRecipeLink = {
  recipe_id: number;
  quantity?: number;
  probability?: number;
};

export type DatabaseRecipeItemRef = {
  id: number;
  quantity?: number;
  probability?: number;
};

export type DatabaseRecipeNpc = {
  id: number;
  name_pt_br: string;
  service_name_pt_br?: string;
};

export type DatabaseNpcService = {
  name_pt_br: string;
  recipe_ids: number[];
};

/** Service flags from NPC_ESSENCE (ids present ⇒ disponível). */
export type DatabaseNpcCapabilities = {
  sell?: boolean;
  buy?: boolean;
  repair?: boolean;
  install?: boolean;
  uninstall?: boolean;
  task_in?: boolean;
  task_out?: boolean;
  teach?: boolean;
  heal?: boolean;
  teleport?: boolean;
  storage?: boolean;
  make?: boolean;
  decompose?: boolean;
  engrave?: boolean;
  engrave_advanced?: boolean;
};

export type DatabaseNpcLocation = {
  map_pt_br?: string;
  x: number;
  y: number;
  z?: number;
};

/** NPC that offers craft/make services (indexed from recipe.npcs + essence). */
export type DatabaseNpcEntry = {
  id: number;
  name_pt_br: string;
  services: DatabaseNpcService[];
  recipe_ids: number[];
  recipe_count: number;
  hello_pt_br?: string;
  capabilities?: DatabaseNpcCapabilities;
  /** Service labels from essence (ex.: Negociação, Gravura). */
  service_labels?: string[];
  /** World coords when available (npcgen / mapa). BR client often empty. */
  locations?: DatabaseNpcLocation[];
  /** Itens da loja (lista 40 / id_sell) — o que o jogador COMPRA do NPC. */
  shop_item_ids?: number[];
  shop_name_pt_br?: string;
  /** Páginas/abas do serviço de venda (até 8 no cliente). */
  shop_pages?: DatabaseNpcShopPage[];
  /** Preço de compra no NPC (shop_price do essence), chave = id do item. */
  shop_prices?: Record<string, number>;
};

export type DatabaseNpcShopPage = {
  index: number;
  item_ids: number[];
};

export type DatabaseRecipe = {
  id: number;
  name_pt_br: string;
  level?: number;
  major_name_pt_br?: string;
  sub_name_pt_br?: string;
  targets: DatabaseRecipeItemRef[];
  materials: DatabaseRecipeItemRef[];
  npcs?: DatabaseRecipeNpc[];
};

export type DatabaseItemLinks = {
  rewarded_by: DatabaseItemQuestLink[];
  required_by: DatabaseItemQuestLink[];
  crafted_by?: DatabaseItemRecipeLink[];
  material_in?: DatabaseItemRecipeLink[];
};

export type DatabaseManifest = {
  schema_version: number;
  generated_at: string;
  origin: DataOrigin;
  items_count: number;
  quests_count: number;
  descriptions_count: number;
  quest_details_count?: number;
  recipes_count?: number;
  npcs_count?: number;
  shops_count?: number;
  linked_items_count?: number;
  files: Record<string, string>;
  list_labels?: Record<string, string>;
  notice: string;
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
