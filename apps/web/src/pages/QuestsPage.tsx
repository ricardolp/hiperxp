import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ZoomableImage } from "../components/ZoomableImage";
import {
  getQuest,
  getQuestCatalog,
  listQuests,
  maps,
  questExcerpt,
  questKindLabel,
  questMapOrder,
} from "../lib/data";
import {
  databaseItemIconSrc,
  ensureDatabaseLoaded,
  getDatabaseItem,
} from "../lib/database";
import type {
  QuestCoord,
  QuestGuideFixture,
  QuestRewardRef,
  QuestStepFixture,
} from "@hiperxp/contracts";

function formatCoord(c: QuestCoord): string {
  return c.altitude == null ? `${c.x}, ${c.y}` : `${c.x}, ${c.y} (${c.altitude})`;
}

function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function stepsLabel(count: number): string {
  return count === 1 ? "1 etapa" : `${count} etapas`;
}

function rewardMetaIconSrc(label: string): string | null {
  const key = label.trim().toLowerCase();
  if (key === "exp" || key === "experiência" || key === "experiencia") {
    return "/ui/rewards/exp.svg";
  }
  if (
    key === "vital" ||
    key === "vitalidade" ||
    key === "spirit" ||
    key === "sp"
  ) {
    return "/ui/rewards/vital.svg";
  }
  return null;
}

function RewardIcon({
  itemId,
  metaSrc,
}: {
  itemId?: number | null;
  metaSrc?: string | null;
}) {
  const [failed, setFailed] = useState(false);
  const src =
    itemId != null
      ? databaseItemIconSrc(itemId)
      : metaSrc ?? null;
  useEffect(() => {
    setFailed(false);
  }, [src]);
  return (
    <span className="db-icon db-icon--sm" aria-hidden>
      {src && !failed ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="db-icon-fallback">◇</span>
      )}
    </span>
  );
}

function QuestRewardList({ rewards }: { rewards: QuestRewardRef[] }) {
  return (
    <ul className="db-rel-list qg-reward-list">
      {rewards.map((reward) => {
        const dbItem =
          reward.item_id != null ? getDatabaseItem(reward.item_id) : null;
        const label = dbItem?.name_pt_br || reward.label_pt_br;
        const qty =
          reward.quantity != null && reward.quantity > 0
            ? ` · ×${reward.quantity}`
            : "";
        const metaSrc =
          reward.item_id == null ? rewardMetaIconSrc(reward.label_pt_br) : null;
        const body = (
          <>
            <RewardIcon itemId={reward.item_id} metaSrc={metaSrc} />
            <span className="qg-reward-copy">
              <span className="qg-reward-name">
                {label}
                {qty ? <span className="muted">{qty}</span> : null}
              </span>
              {reward.note_pt_br ? (
                <span className="qg-reward-note">{reward.note_pt_br}</span>
              ) : null}
            </span>
          </>
        );
        return (
          <li key={`${reward.label_pt_br}-${reward.item_id ?? "x"}`}>
            {reward.item_id != null ? (
              <Link
                className="db-rel-item"
                to={`/database/itens/${reward.item_id}`}
                title={label}
              >
                {body}
              </Link>
            ) : (
              <span className="db-rel-item">{body}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function QuestPostCard({ quest }: { quest: QuestGuideFixture }) {
  const mapName = maps[quest.map_slug]?.name_pt_br ?? quest.map_slug;
  const date = formatDate(quest.published_at);
  return (
    <article className="qg-list-item">
      <Link className="qg-list-link" to={`/missoes/${quest.map_slug}/${quest.slug}`}>
        <div className="qg-list-kicker">
          <span className="qg-pill">{questKindLabel(quest.kind)}</span>
          <span className="qg-kicker-sep" aria-hidden>
            ·
          </span>
          <span>{mapName}</span>
          {date ? (
            <>
              <span className="qg-kicker-sep" aria-hidden>
                ·
              </span>
              <time dateTime={quest.published_at ?? undefined}>{date}</time>
            </>
          ) : null}
        </div>
        <h2 className="qg-list-title">{quest.name_pt_br}</h2>
        <p className="qg-list-excerpt">{questExcerpt(quest)}</p>
        <div className="qg-list-foot">
          <span className="qg-list-steps">{stepsLabel(quest.steps.length)}</span>
          <span className="qg-list-cta">Ler guia</span>
        </div>
      </Link>
    </article>
  );
}

export function QuestsIndexPage() {
  return <Navigate to="/missoes/cidade-da-paz" replace />;
}

export function QuestsPage() {
  const { mapSlug = questMapOrder[0] } = useParams();
  const catalog = getQuestCatalog(mapSlug);
  const quests = listQuests(mapSlug);

  if (
    !catalog ||
    !questMapOrder.includes(mapSlug as (typeof questMapOrder)[number])
  ) {
    return <Navigate to={`/missoes/${questMapOrder[0]}`} replace />;
  }

  const mapName = maps[mapSlug]?.name_pt_br ?? catalog.name_pt_br ?? mapSlug;
  const seriesLead =
    mapSlug === "tianyu"
      ? "Jornadas e diárias de exploração"
      : mapSlug === "continente-ocidental"
        ? "Diárias de vigor e escolta"
        : mapSlug === "mundo-primitivo"
          ? "Diárias de Vigor (Limite de Céu)"
          : "Missões globais e diárias da cidade";
  const pageLead =
    mapSlug === "continente-ocidental"
      ? `Diárias de Vigor, Espíritos Sagrados e escolta em ${mapName}.`
      : mapSlug === "mundo-primitivo"
        ? `Diárias de Vigor do Limite de Céu em ${mapName} (Story Mode e farm).`
        : `Etapas e coordenadas das missões em ${mapName}. Guias comunitários para explorar o continente oriental.`;

  return (
    <main className="page qg-page">
      <header className="qg-page-header">
        <p className="qg-eyebrow">Guias · Perfect World</p>
        <h1>
          {mapSlug === "continente-ocidental" || mapSlug === "mundo-primitivo"
            ? `Missões — ${mapName}`
            : `Missões do Reino Oriental — ${mapName}`}
        </h1>
        <p className="qg-page-lead">{pageLead}</p>
      </header>

      <nav className="qg-tabs" aria-label="Séries de missões">
        {questMapOrder.map((slug) => {
          const label = maps[slug]?.name_pt_br ?? slug;
          const count = listQuests(slug).length;
          const active = slug === mapSlug;
          return (
            <Link
              key={slug}
              to={`/missoes/${slug}`}
              className={`qg-tab${active ? " is-active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <span className="qg-tab-label">{label}</span>
              <span className="qg-tab-count">{count}</span>
            </Link>
          );
        })}
      </nav>

      <section className="qg-series" aria-label={mapName}>
        <div className="qg-series-head">
          <h2>{mapName}</h2>
          <p>{seriesLead}</p>
        </div>

        <div className="qg-list">
          {quests.map((quest) => (
            <QuestPostCard key={quest.id} quest={quest} />
          ))}
        </div>
      </section>
    </main>
  );
}

function isPhotoStep(step: QuestStepFixture): boolean {
  return step.title_pt_br.startsWith("Foto");
}

function QuestWikiPost({
  quest,
  mapSlug,
  mapName,
  mapAsset,
  date,
  siblings,
  prev,
  next,
}: {
  quest: QuestGuideFixture;
  mapSlug: string;
  mapName: string;
  mapAsset: string;
  date: string | null;
  siblings: QuestGuideFixture[];
  prev: QuestGuideFixture | null;
  next: QuestGuideFixture | null;
}) {
  const photoSteps = quest.steps.filter(isPhotoStep);
  const guideSteps = quest.steps.filter((s) => !isPhotoStep(s));
  const floatImage =
    guideSteps.find((s) => s.image_url?.includes("route-map")) ??
    guideSteps.find((s) => Boolean(s.image_url));
  const startNpc = guideSteps.find((s) => s.npc)?.npc ?? null;
  const startCoord =
    guideSteps.find((s) => s.npc && s.coords.length > 0)?.coords[0] ??
    guideSteps.find((s) => s.coords.length > 0)?.coords[0] ??
    null;
  const cover = quest.cover_image || mapAsset;
  const hasMapLink = Boolean(maps[quest.map_slug]?.points?.length);
  const structuredRewards = quest.rewards?.length ? quest.rewards : null;
  const [, setDbTick] = useState(0);

  useEffect(() => {
    let alive = true;
    void ensureDatabaseLoaded().then(() => {
      if (alive) setDbTick((n) => n + 1);
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <main className="qg-wiki">
      <div className="qg-wiki-wrap">
        <nav className="qg-wiki-crumb" aria-label="Navegação do guia">
          <Link to="/">Início</Link>
          <span aria-hidden>/</span>
          <Link to={`/missoes/${mapSlug}`}>{mapName}</Link>
          <span aria-hidden>/</span>
          <span aria-current="page">{quest.name_pt_br}</span>
        </nav>

        <header className="qg-wiki-header">
          <div className="qg-wiki-meta">
            <span className="qg-post-cat">{questKindLabel(quest.kind)}</span>
            <span>
              Guia {quest.order}/{siblings.length}
            </span>
            {date ? (
              <time dateTime={quest.published_at ?? undefined}>{date}</time>
            ) : null}
            <span>{stepsLabel(quest.steps.length)}</span>
          </div>
          <h1>{quest.name_pt_br}</h1>
          {quest.summary_pt_br ? (
            <p className="qg-wiki-lead">{quest.summary_pt_br}</p>
          ) : null}
        </header>

        <div className="qg-wiki-layout">
          <article className="qg-wiki-article">
            <aside className="qg-wiki-infobox" aria-label="Detalhes da missão">
              {cover ? (
                hasMapLink ? (
                  <Link to={`/mapas/${quest.map_slug}`}>
                    <img
                      className="qg-wiki-infobox-cover"
                      src={cover}
                      alt=""
                      decoding="async"
                    />
                  </Link>
                ) : (
                  <img
                    className="qg-wiki-infobox-cover"
                    src={cover}
                    alt=""
                    decoding="async"
                  />
                )
              ) : null}
              <table>
                <tbody>
                  <tr>
                    <th>Local</th>
                    <td>{mapName}</td>
                  </tr>
                  <tr>
                    <th>Tipo</th>
                    <td>{questKindLabel(quest.kind)}</td>
                  </tr>
                  {startNpc ? (
                    <tr>
                      <th>NPC</th>
                      <td>
                        {startNpc}
                        {startCoord ? (
                          <>
                            <br />
                            <code>{formatCoord(startCoord)}</code>
                          </>
                        ) : null}
                      </td>
                    </tr>
                  ) : null}
                  {quest.prerequisite_pt_br ? (
                    <tr>
                      <th>Pré-req.</th>
                      <td>{quest.prerequisite_pt_br}</td>
                    </tr>
                  ) : null}
                  {structuredRewards ? (
                    <tr>
                      <th>Recompensa</th>
                      <td>
                        <QuestRewardList rewards={structuredRewards} />
                      </td>
                    </tr>
                  ) : quest.rewards_pt_br ? (
                    <tr>
                      <th>Recompensa</th>
                      <td>{quest.rewards_pt_br}</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </aside>

            <section className="qg-wiki-section qg-wiki-section--part1">
              <h2>Objetivos</h2>
              {floatImage?.image_url ? (
                <figure className="qg-wiki-thumb">
                  <ZoomableImage
                    src={floatImage.image_url}
                    alt={floatImage.image_alt || floatImage.title_pt_br}
                    caption={floatImage.image_alt}
                  />
                  {floatImage.image_alt ? (
                    <figcaption>{floatImage.image_alt}</figcaption>
                  ) : null}
                </figure>
              ) : null}

              <ol className="qg-wiki-olist">
                {guideSteps.map((s) => (
                  <li key={s.id} id={s.id}>
                    <strong>{s.title_pt_br}</strong>
                    {" — "}
                    {s.instruction_pt_br}
                    {s.coords.length > 0 ? (
                      <>
                        {" "}
                        (
                        {s.coords.map((c, i) => (
                          <span key={`${c.x}-${c.y}-${c.altitude ?? "n"}`}>
                            {i > 0 ? ", " : null}
                            <code>{formatCoord(c)}</code>
                          </span>
                        ))}
                        {s.npc ? <> · {s.npc}</> : null})
                      </>
                    ) : s.npc ? (
                      <> ({s.npc})</>
                    ) : null}
                    {s.dialog_hint ? (
                      <div className="qg-wiki-hint">
                        Diálogo: {s.dialog_hint}
                      </div>
                    ) : null}
                    {s.notes ? (
                      <div className="qg-wiki-hint qg-wiki-hint--note">
                        {s.notes}
                      </div>
                    ) : null}
                    {s.image_url && s !== floatImage ? (
                      <figure className="qg-wiki-inline-shot">
                        <img
                          src={s.image_url}
                          alt={s.image_alt || s.title_pt_br}
                          loading="lazy"
                          decoding="async"
                        />
                      </figure>
                    ) : null}
                  </li>
                ))}
              </ol>
            </section>

            {photoSteps.length > 0 ? (
              <section className="qg-wiki-section qg-wiki-section--clear">
                <h2>Galeria de locais</h2>
                <p>
                  Compare a imagem do Fragmento de Memória com os locais abaixo.
                  Use o autofalante da missão fixada para soltar a coordenada no
                  chat. Há {photoSteps.length} locais possíveis:
                </p>
                <div className="qg-wiki-gallery">
                  {photoSteps.map((s) => {
                    const name = s.title_pt_br.replace(/^Foto — /, "");
                    const coord = s.coords[0] ? formatCoord(s.coords[0]) : null;
                    return (
                      <figure key={s.id} id={s.id} className="qg-wiki-shot">
                        {s.image_url ? (
                          <ZoomableImage
                            src={s.image_url}
                            alt={s.image_alt || name}
                            caption={
                              coord
                                ? `Local: ${name} (${coord})`
                                : `Local: ${name}`
                            }
                          />
                        ) : null}
                        <figcaption>
                          <strong>Local: {name}</strong>
                          {coord ? <span>({coord})</span> : null}
                          {s.notes ? <em>{s.notes}</em> : null}
                        </figcaption>
                      </figure>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {structuredRewards || quest.rewards_pt_br ? (
              <section className="qg-wiki-section qg-wiki-section--clear">
                <h2>Recompensas</h2>
                {structuredRewards ? (
                  <QuestRewardList rewards={structuredRewards} />
                ) : (
                  <p>{quest.rewards_pt_br}</p>
                )}
              </section>
            ) : null}

            <nav className="qg-pager" aria-label="Outros guias da série">
              {prev ? (
                <Link
                  className="qg-pager-link"
                  to={`/missoes/${mapSlug}/${prev.slug}`}
                >
                  <span className="qg-pager-dir">Anterior</span>
                  <span className="qg-pager-title">{prev.name_pt_br}</span>
                </Link>
              ) : (
                <span />
              )}
              {next ? (
                <Link
                  className="qg-pager-link qg-pager-link--next"
                  to={`/missoes/${mapSlug}/${next.slug}`}
                >
                  <span className="qg-pager-dir">Próximo</span>
                  <span className="qg-pager-title">{next.name_pt_br}</span>
                </Link>
              ) : (
                <span />
              )}
            </nav>
          </article>
        </div>
      </div>
    </main>
  );
}

export function QuestPostPage() {
  const { mapSlug = "", questSlug = "" } = useParams();
  const quest = getQuest(mapSlug, questSlug);
  const catalog = getQuestCatalog(mapSlug);

  if (!quest || !catalog) {
    return <Navigate to={`/missoes/${mapSlug || questMapOrder[0]}`} replace />;
  }

  const mapName = maps[quest.map_slug]?.name_pt_br ?? quest.map_slug;
  const mapAsset = maps[quest.map_slug]?.asset ?? `/maps/${quest.map_slug}.webp`;
  const date = formatDate(quest.published_at);
  const siblings = listQuests(mapSlug);
  const idx = siblings.findIndex((q) => q.slug === quest.slug);
  const prev = idx > 0 ? siblings[idx - 1] : null;
  const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;

  return (
    <QuestWikiPost
      quest={quest}
      mapSlug={mapSlug}
      mapName={mapName}
      mapAsset={mapAsset}
      date={date}
      siblings={siblings}
      prev={prev}
      next={next}
    />
  );
}
