import { useState } from "react";
import { Link } from "react-router-dom";
import { mapOrder, maps } from "../lib/data";

const MAP_BLURBS: Record<string, string> = {
  "cidade-da-paz": "Baús, reflexos, desafios e recursos diários.",
  tianyu: "Exploração com filtros e progresso local.",
  jingxuan: "Pontos, coordenadas e checklist no mapa.",
};

const FAQ_ITEMS = [
  {
    id: "como-usar-mapa",
    question: "Como usar o mapa?",
    answer:
      "Abra um mapa do Oriente, filtre os tipos à esquerda e clique nos ícones para copiar coordenadas ou marcar como concluído.",
  },
  {
    id: "progresso",
    question: "O progresso fica salvo?",
    answer:
      "Sim. O progresso fica neste navegador. Use Limpar no mapa se quiser zerar as marcações daquele mapa.",
  },
  {
    id: "simulador",
    question: "O simulador altera algo no jogo?",
    answer:
      "Não. A simulação de baús é só consulta e não conecta à sua conta.",
  },
];

export function HomePage() {
  const [openFaq, setOpenFaq] = useState<string | null>(FAQ_ITEMS[0]?.id ?? null);

  return (
    <main className="page home-page">
      <section className="hero home-hero">
        <div className="badge">Reino Oriental</div>
        <h1>Mapas e simulador de baús</h1>
        <p>
          Explore Cidade da Paz, Tianyu e Jingxuan, marque seu progresso e
          simule aberturas de baús.
        </p>
      </section>

      <section className="home-faq" aria-label="Perguntas frequentes">
        <div className="home-faq-bar">
          <h2>Dúvidas rápidas</h2>
          <p className="muted">Vamos enriquecendo esta lista com o tempo.</p>
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

      <section className="home-cards" aria-label="Entradas principais">
        <div className="home-cards-head">
          <h2>Começar</h2>
          <p className="muted">Escolha um mapa ou o simulador.</p>
        </div>
        <div className="entry-grid home-entry-grid">
          {mapOrder.map((slug) => {
            const map = maps[slug]!;
            return (
              <Link key={slug} className="entry-card home-card" to={`/mapas/${slug}`}>
                <div className="home-card-top">
                  <span className="badge">Mapa</span>
                  <span className="home-card-count">{map.points.length} pts</span>
                </div>
                <h2>{map.name_pt_br}</h2>
                <p>{MAP_BLURBS[slug] ?? "Mapa interativo com filtros."}</p>
                <span className="home-card-cta">Abrir mapa →</span>
              </Link>
            );
          })}
          <Link className="entry-card home-card home-card--accent" to="/simulador">
            <div className="home-card-top">
              <span className="badge">Simulador</span>
            </div>
            <h2>Baús</h2>
            <p>Simule aberturas e veja as chances de cada item.</p>
            <span className="home-card-cta">Abrir simulador →</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
