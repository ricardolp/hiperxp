import { useDeferredValue, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  featuredQuestPosts,
  mapOrder,
  maps,
  questExcerpt,
  questKindLabel,
} from "../lib/data";
import { searchSite } from "../lib/search";

const MAP_BLURBS: Record<string, string> = {
  "cidade-da-paz": "Baús, relíquias, desafios e recursos diários.",
  tianyu: "Exploração com filtros e progresso local.",
  jingxuan: "Pontos, coordenadas e checklist no mapa.",
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
    id: "simulador",
    label: "Simulador",
    hint: "Chances de baú",
    to: "/simulador",
    icon: "chest",
  },
] as const;

const FAQ_ITEMS = [
  {
    id: "como-usar-mapa",
    question: "Como usar o mapa?",
    answer:
      "Abra um mapa do Oriente, filtre os tipos à esquerda e clique nos ícones para copiar coordenadas ou marcar como concluído.",
  },
  {
    id: "missoes",
    question: "Os guias de missão vêm do jogo?",
    answer:
      "Os textos e etapas são guias da comunidade. No cliente BR já temos itens de recompensa no elements.data; a árvore de quests (tasks.data) ainda não foi extraída.",
  },
  {
    id: "progresso",
    question: "O progresso fica salvo?",
    answer:
      "Sim. O progresso do mapa fica neste navegador. Use Limpar no mapa se quiser zerar as marcações daquele mapa.",
  },
  {
    id: "simulador",
    question: "O simulador altera algo no jogo?",
    answer:
      "Não. A simulação de baús é só consulta e não conecta à sua conta.",
  },
];

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
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="home-menu-svg">
      <path
        fill="currentColor"
        d="M5 8.5 12 4l7 4.5v7L12 20l-7-4.5v-7Zm2.1.6v5.3L12 17.6l4.9-3.2V9.1L12 5.9 7.1 9.1ZM12 8.2l3.2 2v.9L12 13.2 8.8 11v-.9l3.2-2Z"
      />
    </svg>
  );
}

export function HomePage() {
  const [openFaq, setOpenFaq] = useState<string | null>(FAQ_ITEMS[0]?.id ?? null);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const hits = useMemo(() => searchSite(deferredQuery), [deferredQuery]);
  const searching = deferredQuery.trim().length > 0;
  const posts = featuredQuestPosts(6);
  const featuredMaps = mapOrder.map((slug) => maps[slug]!).filter(Boolean);
  const leadMap = featuredMaps[0];
  const sideMaps = featuredMaps.slice(1);

  return (
    <main className="home-page">
      <div className="home-body">
        <section className="home-search" aria-label="Busca">
          <h1 className="visually-hidden">
            HiperXP — mapas e missões do Reino Oriental Perfect World
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
                  <Link
                    key={hit.id}
                    className="home-guide-card"
                    to={hit.to}
                  >
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
        <section className="home-featured" aria-label="Mapas em destaque">
          <div className="home-section-head">
            <h2>
              <span className="home-section-accent" aria-hidden />
              Em destaque
            </h2>
            <p className="muted">Regiões do Oriente com pontos e progresso local.</p>
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

        <section className="home-guides" aria-label="Guias de missão" id="missoes">
          <div className="home-section-head">
            <h2>
              <span className="home-section-accent" aria-hidden />
              Missões &amp; guias
            </h2>
            <Link className="home-section-link" to="/missoes">
              Ver todos →
            </Link>
          </div>
          <div className="home-guide-grid">
            {posts.map((quest) => {
              const mapName = maps[quest.map_slug]?.name_pt_br ?? quest.map_slug;
              const date = formatDate(quest.published_at);
              return (
                <Link
                  key={quest.id}
                  className="home-guide-card"
                  to={`/missoes/${quest.map_slug}/${quest.slug}`}
                >
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
                  <span className="home-guide-cta">Ler guia →</span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="home-faq" aria-label="Perguntas frequentes">
          <div className="home-faq-bar">
            <h2>
              <span className="home-section-accent" aria-hidden />
              Dúvidas rápidas
            </h2>
            <p className="muted">Mapas, missões e simulador.</p>
          </div>
          <div className="home-faq-list">
            {FAQ_ITEMS.map((item) => {
              const open = openFaq === item.id;
              return (
                <div
                  key={item.id}
                  className={`home-faq-item${open ? " is-open" : ""}`}
                >
                  <button
                    type="button"
                    className="home-faq-trigger"
                    aria-expanded={open}
                    onClick={() => setOpenFaq(open ? null : item.id)}
                  >
                    <span>{item.question}</span>
                    <span className="home-faq-caret" aria-hidden>
                      {open ? "−" : "+"}
                    </span>
                  </button>
                  {open ? <p className="home-faq-answer">{item.answer}</p> : null}
                </div>
              );
            })}
          </div>
        </section>
        </>
        ) : null}
      </div>
    </main>
  );
}
