import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import type { DropTableFixture } from "@hiperxp/contracts";
import type { SimulateResult } from "@hiperxp/drop-engine";
import {
  exclusiveChanceTotal,
  flattenExclusiveEntries,
  gameItemId,
  getDropTable,
  itemIconSrc,
  itemName,
  simulatorChests,
} from "../lib/data";
import { runSimulationInWorker } from "../lib/simulateClient";

const MAX_OPENINGS = 10_000;
const countFormat = new Intl.NumberFormat("pt-BR");
const chanceFormat = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 6,
});

/** Evita dízimas de float (ex.: 99,99999999999999) na UI. */
function formatChancePercent(value: number): string {
  const cleaned = Math.round(value * 1e10) / 1e10;
  const display = Math.abs(cleaned - 100) < 1e-6 ? 100 : cleaned;
  return chanceFormat.format(display);
}

function chestIconSrc(index: number): string {
  return index === 2 ? "/sim/chest-tianyu.png" : "/sim/chest-default.png";
}

function ItemIcon({
  itemId,
  className,
}: {
  itemId: string;
  className: string;
}) {
  const src = itemIconSrc(itemId);
  return (
    <span className={className} aria-hidden={src ? true : undefined}>
      <span aria-hidden="true">◇</span>
      {src ? (
        <img src={src} alt="" onError={(e) => e.currentTarget.remove()} />
      ) : null}
    </span>
  );
}

type RewardAgg = {
  itemId: string;
  name: string;
  quantity: number;
  count: number;
};

function canDraw(table: DropTableFixture): boolean {
  const rows = flattenExclusiveEntries(table).filter(
    (r) => r.groupType === "exclusive_weighted",
  );
  if (rows.length === 0) return false;
  return Math.abs(exclusiveChanceTotal(table) - 100) < 1e-9;
}

function rewardsFromResult(
  result: SimulateResult,
): RewardAgg[] {
  if (
    result.openings.length > 0 &&
    result.openings.length >= result.processed
  ) {
    const counts = new Map<string, RewardAgg>();
    for (const opening of result.openings) {
      for (const reward of opening.rewards) {
        const key = `${reward.item_id}:${reward.quantity}`;
        const prev = counts.get(key);
        if (prev) prev.count += reward.quantity;
        else {
          counts.set(key, {
            itemId: reward.item_id,
            name: itemName(reward.item_id),
            quantity: reward.quantity,
            count: reward.quantity,
          });
        }
      }
    }
    return [...counts.values()].sort((a, b) => b.count - a.count);
  }

  return result.aggregates
    .map((row) => ({
      itemId: row.item_id,
      name: itemName(row.item_id),
      quantity: 1,
      count: Number(row.quantity),
    }))
    .filter((r) => Number.isFinite(r.count) && r.count > 0)
    .sort((a, b) => b.count - a.count);
}

function ChestSimulator({ initialSlug }: { initialSlug?: string }) {
  const initialIndex = Math.max(
    0,
    simulatorChests.findIndex((t) => t.slug === initialSlug),
  );
  const [selected, setSelected] = useState(initialIndex);
  const table = simulatorChests[selected]!;
  const [countText, setCountText] = useState("1");
  const [result, setResult] = useState<SimulateResult | null>(null);
  const [resultsByChest, setResultsByChest] = useState<
    (SimulateResult | null)[]
  >([null, null, null]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cancelRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => cancelRef.current?.();
  }, []);

  useEffect(() => {
    setResult(resultsByChest[selected] ?? null);
    setError(null);
  }, [selected, resultsByChest]);

  const rows = useMemo(() => flattenExclusiveEntries(table), [table]);
  const totalChance = useMemo(() => exclusiveChanceTotal(table), [table]);
  const drawEnabled = canDraw(table);
  const rewards = useMemo(
    () => (result ? rewardsFromResult(result) : []),
    [result],
  );

  async function run(event: FormEvent) {
    event.preventDefault();
    if (running || !drawEnabled) return;
    const openings = Number(countText);
    if (!Number.isInteger(openings) || openings < 1 || openings > MAX_OPENINGS) {
      return;
    }

    setRunning(true);
    setError(null);
    const handle = runSimulationInWorker({
      table,
      count: openings,
    });
    cancelRef.current = handle.cancel;
    try {
      const next = await handle.promise;
      setResultsByChest((prev) => {
        const copy = [...prev];
        copy[selected] = next;
        return copy;
      });
      setResult(next);
      if (next.status === "failed" && next.error) setError(next.error);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha na simulação");
    } finally {
      cancelRef.current = null;
      setRunning(false);
    }
  }

  const statusText = result
    ? result.processed === 1
      ? "1 abertura simulada"
      : `${countFormat.format(result.processed)} aberturas simuladas`
    : !drawEnabled
      ? "Este baú só pode ser simulado quando as chances somam 100%."
      : "Os itens sorteados aparecem aqui.";

  return (
    <div className="chest-sim">
      <div className="chest-sim-credit">
        <div className="chest-sim-credit-bar">
          <img
            className="chest-sim-credit-mark"
            src="/sim/credit-mark.webp"
            width={48}
            height={48}
            alt=""
          />
          <span>
            Este é o Simulador de Baú do Spoiler. Feito pelo Medaline
          </span>
        </div>
      </div>

      <div className="chest-sim-body">
      {initialSlug ? (
        <p className="chest-back">
          <Link to="/simulador">← Simulador</Link>
        </p>
      ) : null}
      <section className="chest-sim-hero" aria-labelledby="sim-title">
        <div className="chest-sim-label">Simulador de recompensas</div>
        <h1 id="sim-title">Abra seus baús</h1>
        <p>
          Escolha um dos baús do spoiler-perfeito da semana e simule a abertura
          com as chances de cada item.
        </p>
      </section>

      <section aria-labelledby="choose">
        <h2 id="choose" className="chest-section-title">
          Escolha um baú
        </h2>
        <div className="chest-cards">
          {simulatorChests.map((chest, index) => {
            const itemCount = flattenExclusiveEntries(chest).length;
            return (
              <button
                key={chest.id}
                type="button"
                className="chest-card"
                aria-pressed={index === selected}
                onClick={() => {
                  if (selected === index) return;
                  setSelected(index);
                }}
              >
                <span className="chest-card-icon" aria-hidden="true">
                  <img
                    src={chestIconSrc(index)}
                    alt=""
                    width={32}
                    height={32}
                  />
                </span>
                <span>
                  <strong>{chest.name_pt_br}</strong>
                  <small>
                    {itemCount === 1 ? "1 item" : `${itemCount} itens`}
                  </small>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="chest-panels">
        <section className="chest-panel" aria-labelledby="itemsTitle">
          <h2 id="itemsTitle">Itens e chances</h2>
          <div className="chest-sum">
            Total: {formatChancePercent(totalChance)}%
          </div>
          {rows.length === 0 ? (
            <p>Este baú está sem itens.</p>
          ) : (
            <div className="chest-table-wrap">
              <table>
                <colgroup>
                  <col className="chest-col-id" />
                  <col />
                  <col className="chest-col-qty" />
                  <col className="chest-col-chance" />
                </colgroup>
                <thead>
                  <tr>
                    <th scope="col">ID</th>
                    <th scope="col">Item</th>
                    <th scope="col" className="chest-qty">
                      Qtd. por sorteio
                    </th>
                    <th scope="col">Chance</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={`${row.entryId}-${row.itemId}-${row.quantity}`}>
                      <td>{gameItemId(row.itemId) ?? row.itemId}</td>
                      <td>
                        <span className="chest-item-label">
                          <ItemIcon
                            itemId={row.itemId}
                            className="chest-table-icon"
                          />
                          <span>{row.name}</span>
                        </span>
                      </td>
                      <td className="chest-qty">
                        {countFormat.format(row.quantity)}
                      </td>
                      <td>{formatChancePercent(row.chancePercent)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="chest-panel" aria-labelledby="simTitle">
          <h2 id="simTitle">Simulação</h2>
          <form onSubmit={(e) => void run(e)}>
            <label htmlFor="openings">Quantidade de aberturas</label>
            <div className="chest-simulate-controls">
              <input
                id="openings"
                name="openings"
                type="number"
                inputMode="numeric"
                min={1}
                max={MAX_OPENINGS}
                step={1}
                value={countText}
                disabled={running}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === "" || /^\d+$/.test(raw)) {
                    setCountText(raw);
                  }
                }}
                required
                aria-describedby="range"
              />
              <button
                type="submit"
                className="chest-action"
                disabled={running || !drawEnabled}
              >
                Simular
              </button>
            </div>
            <p id="range" className="chest-hint">
              De 1 a 10.000 aberturas por simulação.
            </p>
          </form>

          {error ? <p className="chest-error">{error}</p> : null}

          <div className="chest-result">
            <p role="status">{statusText}</p>
            {result && rewards.length > 0 ? (
              <ul className="chest-rewards" aria-label="Itens sorteados">
                {rewards.map((reward) => {
                  const tip = `ID ${gameItemId(reward.itemId) ?? reward.itemId} - ${reward.name} (${countFormat.format(reward.quantity)})`;
                  const icon = itemIconSrc(reward.itemId);
                  return (
                    <li
                      key={`${reward.itemId}:${reward.quantity}:${reward.count}`}
                      className="chest-reward"
                      title={tip}
                    >
                      <span className="visually-hidden">
                        {tip}. Total obtido:{" "}
                      </span>
                      <span className="chest-reward-icon">
                        <span aria-hidden="true">◇</span>
                        {icon ? (
                          <img
                            src={icon}
                            alt=""
                            onError={(e) => e.currentTarget.remove()}
                          />
                        ) : null}
                        <span className="chest-reward-count">
                          {countFormat.format(reward.count)}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>

          {result && rewards.length > 0 ? (
            <aside
              className="chest-reward-help"
              aria-labelledby="rewardHelpTitle"
            >
              <h3 id="rewardHelpTitle">Como ler os resultados</h3>
              <p>
                Passe o mouse sobre um ícone para ver o ID, o nome e a quantidade
                que vem em cada sorteio, indicada entre parênteses. Isso ajuda a
                distinguir recompensas que usam o mesmo ícone.
              </p>
              <p>
                O número no canto do ícone mostra o{" "}
                <strong>total de unidades obtidas</strong>. Por exemplo, se o
                ícone mostra <strong>25</strong> e a dica diz{" "}
                <strong>Extrato Sagrado Bebê Celestial (25)</strong>, você
                recebeu uma recompensa de 25 extratos. Se a dica diz{" "}
                <strong>(1)</strong>, o mesmo total de 25 veio de 25 sorteios de
                um extrato cada.
              </p>
            </aside>
          ) : null}
        </section>
      </div>
      </div>
    </div>
  );
}

export function DropsIndexPage() {
  return (
    <main className="chest-sim-page">
      <ChestSimulator />
    </main>
  );
}

export function DropDetailPage() {
  const { slug = "" } = useParams();
  const table = getDropTable(slug);
  if (!table || !simulatorChests.some((c) => c.slug === slug)) {
    return <Navigate to="/simulador" replace />;
  }
  return (
    <main className="chest-sim-page">
      <ChestSimulator initialSlug={slug} />
    </main>
  );
}
