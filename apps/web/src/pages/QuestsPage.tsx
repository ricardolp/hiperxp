import { Link, Navigate, useParams } from "react-router-dom";
import {
  getQuest,
  getQuestCatalog,
  listQuests,
  maps,
  questExcerpt,
  questKindLabel,
  questMapOrder,
} from "../lib/data";
import type { QuestCoord, QuestGuideFixture } from "@hiperxp/contracts";

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

  return (
    <main className="page qg-page">
      <header className="qg-page-header">
        <p className="qg-eyebrow">Guias · Perfect World</p>
        <h1>Missões do Reino Oriental — {mapName}</h1>
        <p className="qg-page-lead">
          Etapas e coordenadas das missões em {mapName}. Guias comunitários
          para explorar o continente oriental.
        </p>
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
          <p>
            {mapSlug === "tianyu"
              ? "Jornadas de exploração"
              : "Missões globais da cidade"}
          </p>
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
  const related = siblings.filter((q) => q.slug !== quest.slug).slice(0, 4);

  return (
    <main className="qg-post">
      <header
        className="qg-post-hero"
        style={{ backgroundImage: `url(${mapAsset})` }}
      >
        <div className="qg-post-hero-veil" aria-hidden />
        <div className="qg-post-hero-inner">
          <nav className="qg-post-crumb" aria-label="Navegação do guia">
            <Link to="/">Início</Link>
            <span aria-hidden>/</span>
            <Link to={`/missoes/${mapSlug}`}>{mapName}</Link>
            <span aria-hidden>/</span>
            <span aria-current="page">{quest.name_pt_br}</span>
          </nav>

          <div className="qg-post-meta">
            <span className="qg-post-cat">{questKindLabel(quest.kind)}</span>
            <span className="qg-post-meta-item">
              Guia {quest.order}/{siblings.length}
            </span>
            {date ? (
              <time
                className="qg-post-meta-item"
                dateTime={quest.published_at ?? undefined}
              >
                {date}
              </time>
            ) : null}
            <span className="qg-post-meta-item">
              {stepsLabel(quest.steps.length)}
            </span>
          </div>

          <h1>{quest.name_pt_br}</h1>
          {quest.summary_pt_br ? (
            <p className="qg-post-lead">{quest.summary_pt_br}</p>
          ) : null}
        </div>
      </header>

      <div className="qg-post-shell">
        <article className="qg-post-main">
          {(quest.prerequisite_pt_br || quest.rewards_pt_br) && (
            <dl
              className={`qg-facts qg-facts--post${
                quest.prerequisite_pt_br && quest.rewards_pt_br
                  ? " qg-facts--split"
                  : ""
              }`}
            >
              {quest.prerequisite_pt_br ? (
                <div className="qg-fact">
                  <dt>Pré-requisito</dt>
                  <dd>{quest.prerequisite_pt_br}</dd>
                </div>
              ) : null}
              {quest.rewards_pt_br ? (
                <div className="qg-fact">
                  <dt>Recompensas</dt>
                  <dd>{quest.rewards_pt_br}</dd>
                </div>
              ) : null}
            </dl>
          )}

          <section className="qg-steps-section" aria-label="Etapas">
            <div className="qg-steps-heading">
              <h2>Como fazer</h2>
              <span className="qg-steps-count">
                {stepsLabel(quest.steps.length)}
              </span>
            </div>

            <ol className="qg-steps">
              {quest.steps.map((s) => (
                <li key={s.id} className="qg-step">
                  <div className="qg-step-rail" aria-hidden>
                    <span className="qg-step-num">{s.order}</span>
                  </div>
                  <div className="qg-step-body">
                    <h3>{s.title_pt_br}</h3>
                    <p className="qg-step-text">{s.instruction_pt_br}</p>

                    {(s.npc ||
                      s.coords.length > 0 ||
                      s.dialog_hint ||
                      s.notes) && (
                      <div className="qg-step-meta">
                        {s.npc ? (
                          <p>
                            <span className="qg-meta-label">NPC</span>
                            {s.npc}
                          </p>
                        ) : null}
                        {s.coords.length > 0 ? (
                          <div className="qg-coords-block">
                            <span className="qg-meta-label">Coordenadas</span>
                            <ul className="qg-coords">
                              {s.coords.map((c) => (
                                <li key={`${c.x}-${c.y}-${c.altitude ?? "n"}`}>
                                  <code>{formatCoord(c)}</code>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                        {s.dialog_hint ? (
                          <p className="qg-dialog">
                            <span className="qg-meta-label">Diálogo</span>
                            {s.dialog_hint}
                          </p>
                        ) : null}
                        {s.notes ? (
                          <p className="qg-note">
                            <span className="qg-meta-label">Nota</span>
                            {s.notes}
                          </p>
                        ) : null}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </section>

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

        <aside className="qg-post-side" aria-label="Informações do guia">
          <section className="qg-side-panel qg-side-panel--map">
            <Link className="qg-side-map" to={`/mapas/${quest.map_slug}`}>
              <img src={mapAsset} alt="" decoding="async" />
              <div className="qg-side-map-copy">
                <span className="qg-side-kicker">Mapa</span>
                <strong>{mapName}</strong>
                <small>Abrir com pontos e progresso</small>
              </div>
            </Link>
          </section>

          {related.length > 0 ? (
            <section className="qg-side-panel">
              <h2>Mais guias</h2>
              <ul className="qg-side-related">
                {related.map((item) => (
                  <li key={item.id}>
                    <Link to={`/missoes/${mapSlug}/${item.slug}`}>
                      <span className="qg-side-related-top">
                        <span className="qg-post-cat qg-post-cat--sm">
                          {questKindLabel(item.kind)}
                        </span>
                        <span className="qg-side-related-steps">
                          {stepsLabel(item.steps.length)}
                        </span>
                      </span>
                      <strong>{item.name_pt_br}</strong>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </aside>
      </div>
    </main>
  );
}
