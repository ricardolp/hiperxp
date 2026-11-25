import { useDeferredValue, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  featuredQuestPosts,
  maps,
  questExcerpt,
  questGuidePath,
  questKindLabel,
} from "../lib/data";
import {
  HOME_VIDEOS,
  PWBR_COMMUNITY_SEARCH_URL,
  popularQuestPosts,
  questListThumb,
  youtubeWatchUrl,
} from "../lib/homeContent";
import { searchSite } from "../lib/search";

const ORIENTAL_MAPS = ["cidade-da-paz", "tianyu", "jingxuan"] as const;

const MAP_BLURBS: Record<string, string> = {
  "cidade-da-paz": "Baús, relíquias, desafios e recursos diários.",
  tianyu: "Exploração com filtros e progresso local.",
  jingxuan: "Pontos, coordenadas e checklist no mapa.",
  "continente-ocidental": "Diárias de Vigor, Espíritos Sagrados e escolta.",
  "mundo-primitivo": "Diárias de Limite de Céu e farm de Vitae.",
  "mundo-normal": "Saga do Herói — 17 classes com guias e cards.",
};

const SECTION_MENUS = [
  {
    id: "mapas",
    label: "Mapas",
    hint: "Explorar regiões",
    to: "/mapas/cidade-da-paz",
    icon: "map",
  },
  {
    id: "missoes",
    label: "Missões",
    hint: "Guias e jornadas",
    to: "/missoes",
    icon: "quest",
  },
  {
    id: "database",
    label: "Database",
    hint: "Itens e missões do cliente",
    to: "/database",
    icon: "database",
  },
  {
    id: "simulador",
    label: "Simulador",
    hint: "Chances de baú",
    to: "/simulador",
    icon: "chest",
  },
] as const;

function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function MenuIcon({ name }: { name: (typeof SECTION_MENUS)[number]["icon"] }) {
  if (name === "map") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="home-menu-svg">
        <path
          fill="currentColor"
          d="M9.5 3.2 3 5.4v15.2l6.5-2.2 5 2.2 6.5-2.2V3.2L14.5 5.4 9.5 3.2Zm1 2.3 3.5 1.5v11.5l-3.5-1.5V5.5Zm-2 .4v11.5L4.5 19V7.5l4-1.6Zm10.5 1.6v11.5l-4 1.4V8.9l4-1.4Z"
        />
      </svg>
    );
  }
  if (name === "quest") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="home-menu-svg">
        <path
          fill="currentColor"
          d="M7 3h10a2 2 0 0 1 2 2v15.2l-7-3.1-7 3.1V5a2 2 0 0 1 2-2Zm0 2v12.3l5-2.2 5 2.2V5H7Zm5 2.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Zm0 1.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm-2.5 6h5v1.5h-5V15Z"
        />
      </svg>
    );
  }
  if (name === "database") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="home-menu-svg">
        <path
          fill="currentColor"
          d="M12 3c-4.4 0-8 1.6-8 3.5v11C4 19.4 7.6 21 12 21s8-1.6 8-3.5v-11C20 4.6 16.4 3 12 3Zm0 1.5c3.5 0 6.3 1.1 6.3 2S15.5 8.5 12 8.5 5.7 7.4 5.7 6.5 8.5 4.5 12 4.5ZM5.7 9.3c1.5.8 3.7 1.3 6.3 1.3s4.8-.5 6.3-1.3v2.2c0 .9-2.8 2-6.3 2s-6.3-1.1-6.3-2V9.3Zm0 5c1.5.8 3.7 1.3 6.3 1.3s4.8-.5 6.3-1.3v2.2c0 .9-2.8 2-6.3 2s-6.3-1.1-6.3-2v-2.2Z"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="home-menu-svg">
      <path
        fill="currentColor"
        d="M5 8.5 12 4l7 4.5v7L12 20l-7-4.5v-7Zm2.1.6v5.3L12 17.6l4.9-3.2V9.1L12 5.9 7.1 9.1ZM12 8.2l3.2 2v.9L12 13.2 8.8 11v-.9l3.2-2Z"
      />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="home-video-play">
      <path fill="currentColor" d="M8.5 6.8v10.4L18 12 8.5 6.8Z" />
    </svg>
  );
}

export function HomePage() {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const hits = useMemo(() => searchSite(deferredQuery), [deferredQuery]);
  const searching = deferredQuery.trim().length > 0;
  const latestPosts = featuredQuestPosts(6);
  const popularPosts = popularQuestPosts(5);
  const featuredMaps = ORIENTAL_MAPS.map((slug) => maps[slug]!).filter(Boolean);
  const leadMap = featuredMaps[0];
  const sideMaps = featuredMaps.slice(1);

  return (
    <main className="home-page">
      <div className="home-body">
        <section className="home-search" aria-label="Busca">
          <h1 className="visually-hidden">
            HiperXP — mapa Reino Oriental e guias de quest Perfect World (PW)
          </h1>
          <label className="home-search-field" htmlFor="home-search-input">
            <span className="visually-hidden">Buscar mapas, missões e simulador</span>
            <svg
              className="home-search-icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                fill="currentColor"
                d="M10.5 3a7.5 7.5 0 0 1 5.9 12.1l4.25 4.25-1.4 1.4-4.25-4.25A7.5 7.5 0 1 1 10.5 3Zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Z"
              />
            </svg>
            <input
              id="home-search-input"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar missões, mapas, baús… ex.: neve serena"
              autoComplete="off"
              spellCheck={false}
            />
            {query ? (
              <button
                type="button"
                className="home-search-clear"
                onClick={() => setQuery("")}
                aria-label="Limpar busca"
              >
                ✕
              </button>
            ) : null}
          </label>
          <p className="home-search-hint muted">
            {searching
              ? `${hits.length} resultado(s) · ignora maiúsculas e acentos`
              : "Digite para filtrar por nome ou trecho semelhante."}
          </p>
        </section>

        {searching ? (
          <section className="home-guides" aria-label="Resultados da busca">
            <div className="home-section-head">
              <h2>
                <span className="home-section-accent" aria-hidden />
                Resultados
              </h2>
            </div>
            {hits.length === 0 ? (
              <p className="home-search-empty muted">
                Nada encontrado para “{deferredQuery.trim()}”.
              </p>
            ) : (
              <div className="home-guide-grid">
                {hits.map((hit) => (
                  <Link key={hit.id} className="home-guide-card" to={hit.to}>
                    <div className="home-guide-kicker">
                      <span className="qg-post-cat qg-post-cat--sm">
                        {hit.kind === "quest"
                          ? "Missão"
                          : hit.kind === "map"
                            ? "Mapa"
                            : "Simulador"}
                      </span>
                      <span>{hit.subtitle}</span>
                    </div>
                    <h3>{hit.title}</h3>
                    <p>{hit.excerpt}</p>
                    <span className="home-guide-cta">Abrir →</span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        ) : null}

        {!searching ? (
          <>
            <section className="home-featured" aria-label="Mapas do Reino Oriental">
              <div className="home-section-head">
                <h2>
                  <span className="home-section-accent" aria-hidden />
                  Destaque · Reino Oriental
                </h2>
                <p className="muted">Mapas interativos com pontos e progresso local.</p>
              </div>
              <div className="home-mag">
                {leadMap ? (
                  <Link
                    className="home-mag-lead"
                    to={`/mapas/${leadMap.slug}`}
                    style={{
                      backgroundImage: `url(/maps/${leadMap.slug}.webp)`,
                    }}
                  >
                    <span className="home-mag-badge">Mapa</span>
                    <div className="home-mag-copy">
                      <h3>{leadMap.name_pt_br}</h3>
                      <p>{MAP_BLURBS[leadMap.slug] ?? "Mapa interativo com filtros."}</p>
                      <span className="home-mag-meta">
                        {leadMap.points.length} pontos · Abrir mapa
                      </span>
                    </div>
                  </Link>
                ) : null}
                <div className="home-mag-side">
                  {sideMaps.map((map) => (
                    <Link
                      key={map.slug}
                      className="home-mag-card"
                      to={`/mapas/${map.slug}`}
                      style={{
                        backgroundImage: `url(/maps/${map.slug}.webp)`,
                      }}
                    >
                      <span className="home-mag-badge">Mapa</span>
                      <div className="home-mag-copy">
                        <h3>{map.name_pt_br}</h3>
                        <p>{MAP_BLURBS[map.slug] ?? "Mapa interativo."}</p>
                        <span className="home-mag-meta">{map.points.length} pts</span>
                      </div>
                    </Link>
                  ))}
                  <Link className="home-mag-card home-mag-card--sim" to="/simulador">
                    <span className="home-mag-badge">Simulador</span>
                    <div className="home-mag-copy">
                      <h3>Baús e drops</h3>
                      <p>Simule aberturas e veja as chances de cada item.</p>
                      <span className="home-mag-meta">Abrir simulador</span>
                    </div>
                  </Link>
                </div>
              </div>
            </section>

            <nav className="home-menus" aria-label="Seções principais">
              {SECTION_MENUS.map((item) => (
                <Link key={item.id} className="home-menu-item" to={item.to}>
                  <span className="home-menu-icon">
                    <MenuIcon name={item.icon} />
                  </span>
                  <span className="home-menu-text">
                    <strong>{item.label}</strong>
                    <span>{item.hint}</span>
                  </span>
                </Link>
              ))}
            </nav>

            <section className="home-blog" aria-label="Publicações e populares">
              <div className="home-blog-main">
                <div className="home-section-head">
                  <h2>
                    <span className="home-section-accent" aria-hidden />
                    Últimas publicações
                  </h2>
                  <Link className="home-section-link" to="/missoes">
                    Ver todos →
                  </Link>
                </div>
                <div className="home-post-list">
                  {latestPosts.map((quest) => {
                    const mapName = maps[quest.map_slug]?.name_pt_br ?? quest.map_slug;
                    const date = formatDate(quest.published_at);
                    return (
                      <Link
                        key={quest.id}
                        className="home-post-row"
                        to={questGuidePath(quest)}
                      >
                        <div
                          className="home-post-thumb"
                          style={{
                            backgroundImage: `url(${questListThumb(quest)})`,
                          }}
                          aria-hidden
                        />
                        <div className="home-post-body">
                          <div className="home-guide-kicker">
                            <span className="qg-post-cat qg-post-cat--sm">
                              {questKindLabel(quest.kind)}
                            </span>
                            <span>{mapName}</span>
                            {date ? (
                              <time dateTime={quest.published_at ?? undefined}>
                                {date}
                              </time>
                            ) : null}
                          </div>
                          <h3>{quest.name_pt_br}</h3>
                          <p>{questExcerpt(quest)}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              <aside className="home-blog-side" aria-label="Mais vistos">
                <div className="home-side-panel">
                  <div className="home-section-head">
                    <h2>
                      <span className="home-section-accent" aria-hidden />
                      Popular Posts
                    </h2>
                  </div>
                  <ol className="home-popular-list">
                    {popularPosts.map((quest, index) => {
                      const mapName =
                        maps[quest.map_slug]?.name_pt_br ?? quest.map_slug;
                      return (
                        <li key={quest.id}>
                          <Link
                            className="home-popular-item"
                            to={questGuidePath(quest)}
                          >
                            <span className="home-popular-rank" aria-hidden>
                              {String(index + 1).padStart(2, "0")}
                            </span>
                            <div
                              className="home-popular-thumb"
                              style={{
                                backgroundImage: `url(${questListThumb(quest)})`,
                              }}
                              aria-hidden
                            />
                            <div className="home-popular-copy">
                              <strong>{quest.name_pt_br}</strong>
                              <span>
                                {questKindLabel(quest.kind)} · {mapName}
                              </span>
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              </aside>
            </section>

            <section className="home-videos" aria-label="Vídeos da comunidade PWBR">
              <div className="home-section-head">
                <h2>
                  <span className="home-section-accent" aria-hidden />
                  Comunidade · #PWBR
                </h2>
                <a
                  className="home-section-link"
                  href={PWBR_COMMUNITY_SEARCH_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Mais da comunidade →
                </a>
              </div>
              <div className="home-video-grid">
                {HOME_VIDEOS.map((video) => (
                  <a
                    key={video.id}
                    className="home-video-card"
                    href={youtubeWatchUrl(video.youtubeId)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span
                      className="home-video-thumb"
                      style={{
                        backgroundImage: `url(${video.thumb})`,
                      }}
                    >
                      <span className="home-video-badge">#PWBR</span>
                      <span className="home-video-play-wrap" aria-hidden>
                        <PlayIcon />
                      </span>
                    </span>
                    <span className="home-video-copy">
                      <strong>{video.title}</strong>
                      <span>{video.channel}</span>
                    </span>
                  </a>
                ))}
              </div>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
