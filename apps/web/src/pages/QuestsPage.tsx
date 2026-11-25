import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ZoomableImage } from "../components/ZoomableImage";
import { CoordChip } from "../components/CoordChip";
import { QuestMapEmbed } from "../components/QuestMapEmbed";
import { QuestInstructionBody } from "../lib/questInstruction";
import {
  getMap,
  getQuest,
  getQuestCatalog,
  listQuests,
  maps,
  questExcerpt,
  questKindLabel,
  hasPublicMapPage,
  questEmbedRedirects,
  questGuidePath,
  questMapOrder,
} from "../lib/data";
import { ensureDatabaseLoaded, getDatabaseItem } from "../lib/database";
import { ItemIcon } from "../components/ItemIcon";
import type {
  QuestGuideFixture,
  QuestRewardRef,
  QuestStepFixture,
} from "@hiperxp/contracts";

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
  if (itemId != null) {
    return (
      <ItemIcon
        id={itemId}
        className="db-icon db-icon--sm"
        extraSources={metaSrc ? [metaSrc] : undefined}
      />
    );
  }
  if (!metaSrc) {
    return (
      <span className="db-icon db-icon--sm" aria-hidden>
        <span className="db-icon-fallback">◇</span>
      </span>
    );
  }
  return (
    <span className="db-icon db-icon--sm" aria-hidden>
      <img src={metaSrc} alt="" loading="lazy" />
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

function catalogMapLabel(mapSlug: string): string {
  if (mapSlug === "drops-reino-oriental") {
    return maps["cidade-da-paz"]?.name_pt_br ?? "Cidade da Paz";
  }
  if (mapSlug === "drops-tianyu") {
    return maps.tianyu?.name_pt_br ?? "Tianyu";
  }
  return maps[mapSlug]?.name_pt_br ?? mapSlug;
}

function QuestPostCard({ quest }: { quest: QuestGuideFixture }) {
  const mapName = catalogMapLabel(quest.map_slug);
  const date = formatDate(quest.published_at);
  return (
    <article className="qg-list-item">
      <Link className="qg-list-link" to={questGuidePath(quest)}>
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
  const embedRedirect = questEmbedRedirects[mapSlug];
  if (embedRedirect) {
    return <Navigate to={embedRedirect} replace />;
  }
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
        : "Missões globais e diárias da cidade";
  const pageLead =
    mapSlug === "continente-ocidental"
      ? `Diárias de Vigor, Espíritos Sagrados e escolta em ${mapName}.`
      : `Etapas e coordenadas das missões em ${mapName}. Guias comunitários para explorar o continente oriental.`;

  return (
    <main className="page qg-page">
      <header className="qg-page-header">
        <p className="qg-eyebrow">Guias · Perfect World</p>
        <h1>
          {mapSlug === "continente-ocidental"
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
  return /^(Foto|Paisagem|Cenário)\b/.test(step.title_pt_br);
}

function photoStepLabel(title: string): string {
  return title.replace(/^(Foto|Paisagem|Cenário)\s*[—-]\s*/, "");
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
  const startNpcStep =
    guideSteps.find((s) => s.npc && s.coords.length > 0) ??
    guideSteps.find((s) => s.npc) ??
    null;
  const startNpc = startNpcStep?.npc ?? null;
  // Only show a coord next to the NPC when that same step has coords —
  // never borrow unlock/map coords from another step.
  const startCoord = startNpcStep?.coords[0] ?? null;
  const cover = quest.cover_image || mapAsset;
  const questMap = getMap(quest.map_slug);
  const hasMapLink =
    Boolean(questMap?.points?.length) && hasPublicMapPage(quest.map_slug);
  // Placeholder/synthetic maps (Quedanunca, MP…) look empty — coords only.
  const showMapEmbed =
    Boolean(questMap?.points?.length) &&
    !questMap?.synthetic &&
    (quest.map_slug.startsWith("drops-") ||
      questMap?.points.every(
        (p) =>
          (p.icon_key || "").startsWith("drop-") ||
          (p.icon_key || "") === "quest-imagem" ||
          p.category === "npc" ||
          p.category === "quest_objective",
      ));
  const inlinePhotoGallery =
    photoSteps.length > 0 &&
    (quest.map_slug.startsWith("drops-") || showMapEmbed);
  const embedAnchorStepId =
    guideSteps.find((s) =>
      /etapa\s*1|coordenadas das imagens/i.test(s.title_pt_br),
    )?.id ?? guideSteps[0]?.id;
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

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;
    const t = window.setTimeout(() => {
      document.getElementById(hash)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);
    return () => window.clearTimeout(t);
  }, [quest.id, photoSteps.length]);

  function jumpTo(id: string) {
    const href = `#${id}`;
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}${href}`,
    );
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

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
            <div className="qg-wiki-lead">
              <QuestInstructionBody text={quest.summary_pt_br} />
            </div>
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
                            <CoordChip coord={startCoord} />
                          </>
                        ) : null}
                      </td>
                    </tr>
                  ) : null}
                  {quest.prerequisite_pt_br ? (
                    <tr>
                      <th>Pré-req.</th>
                      <td>
                        <QuestInstructionBody
                          text={quest.prerequisite_pt_br}
                          className="qg-wiki-inline-rich"
                        />
                      </td>
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

            {guideSteps.length > 1 ? (
              <nav className="qg-wiki-toc" aria-label="Índice do guia">
                <h2>Índice</h2>
                <ol className="qg-wiki-toc-list">
                  {guideSteps.map((s, i) => (
                    <li key={s.id}>
                      <a
                        className="qg-wiki-toc-link"
                        href={`#${s.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          jumpTo(s.id);
                        }}
                      >
                        <span className="qg-wiki-toc-num">{i + 1}.</span>
                        {s.title_pt_br}
                      </a>
                    </li>
                  ))}
                  {photoSteps.length > 0 ? (
                    <li>
                      <a
                        className="qg-wiki-toc-link"
                        href="#galeria"
                        onClick={(e) => {
                          e.preventDefault();
                          jumpTo("galeria");
                        }}
                      >
                        Imagens de referência
                      </a>
                    </li>
                  ) : null}
                </ol>
              </nav>
            ) : null}

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
                {guideSteps.map((s, i) => (
                  <li key={s.id} id={s.id} className="qg-wiki-step">
                    <strong className="qg-wiki-step-title">
                      {s.title_pt_br}
                    </strong>
                    <QuestInstructionBody
                      text={s.instruction_pt_br}
                      fallbackCoords={
                        s.id === embedAnchorStepId && inlinePhotoGallery
                          ? []
                          : s.coords
                      }
                      npc={s.npc}
                    />
                    {s.id === embedAnchorStepId && inlinePhotoGallery ? (
                      <div id="galeria" className="qg-wiki-step-gallery">
                        <p className="qg-wiki-step-gallery-lead">
                          Compare a imagem da missão com os {photoSteps.length}{" "}
                          locais abaixo:
                        </p>
                        <div className="qg-wiki-gallery">
                          {photoSteps.map((ps) => {
                            const name = photoStepLabel(ps.title_pt_br);
                            const coord = ps.coords[0] ?? null;
                            return (
                              <figure
                                key={ps.id}
                                id={ps.id}
                                className="qg-wiki-shot"
                              >
                                {ps.image_url ? (
                                  <ZoomableImage
                                    src={ps.image_url}
                                    alt={ps.image_alt || name}
                                    caption={`Local: ${name}`}
                                  />
                                ) : null}
                                <figcaption>
                                  <strong>{name}</strong>
                                  {coord ? <CoordChip coord={coord} /> : null}
                                  {ps.notes ? <em>{ps.notes}</em> : null}
                                </figcaption>
                              </figure>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                    {showMapEmbed &&
                    questMap &&
                    s.id === embedAnchorStepId ? (
                      <div
                        id="mapa"
                        className="qg-wiki-step-map"
                        aria-label={`Mapa ${mapName}`}
                      >
                        <QuestMapEmbed
                          map={questMap}
                          caption="Câmera = local da imagem (Etapa 1) · círculo = ícone do drop do mob (Etapa 3)"
                        />
                      </div>
                    ) : null}
                    {s.dialog_hint ? (
                      <div className="qg-wiki-hint">
                        <span className="qg-wiki-hint-label">Diálogo</span>
                        <QuestInstructionBody
                          text={s.dialog_hint}
                          className="qg-wiki-inline-rich"
                        />
                      </div>
                    ) : null}
                    {s.notes ? (
                      <div className="qg-wiki-hint qg-wiki-hint--note">
                        <QuestInstructionBody
                          text={s.notes}
                          className="qg-wiki-inline-rich"
                        />
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

            {!inlinePhotoGallery && photoSteps.length > 0 ? (
              <section
                id="galeria"
                className="qg-wiki-section qg-wiki-section--clear"
              >
                <h2>Galeria de locais</h2>
                <p>
                  Compare a imagem da missão com os locais abaixo. Use o mapa e
                  a lista de tarefas na tela enquanto procura. Há{" "}
                  {photoSteps.length} locais possíveis:
                </p>
                <div className="qg-wiki-gallery">
                  {photoSteps.map((s) => {
                    const name = photoStepLabel(s.title_pt_br);
                    const coord = s.coords[0] ?? null;
                    return (
                      <figure key={s.id} id={s.id} className="qg-wiki-shot">
                        {s.image_url ? (
                          <ZoomableImage
                            src={s.image_url}
                            alt={s.image_alt || name}
                            caption={`Local: ${name}`}
                          />
                        ) : null}
                        <figcaption>
                          <strong>Local: {name}</strong>
                          {coord ? <CoordChip coord={coord} /> : null}
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
  const embedRedirect = questEmbedRedirects[mapSlug];
  if (embedRedirect) {
    return <Navigate to={embedRedirect} replace />;
  }
  const quest = getQuest(mapSlug, questSlug);
  const catalog = getQuestCatalog(mapSlug);

  if (!quest || !catalog) {
    return <Navigate to={`/missoes/${mapSlug || questMapOrder[0]}`} replace />;
  }

  const mapName =
    maps[mapSlug]?.name_pt_br ??
    maps[quest.map_slug]?.name_pt_br ??
    quest.map_slug;
  const mapAsset =
    maps[quest.map_slug]?.asset ??
    maps[mapSlug]?.asset ??
    `/maps/${mapSlug}.webp`;
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
