import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { QuestCoord } from "@hiperxp/contracts";
import { CoordChip, coordKey } from "../components/CoordChip";

/** Matches `183,396(66)`, `183, 403 (69)`, or `183, 403`. */
const COORD_RE =
  /(\d{1,4})\s*,\s*(\d{1,4})(?:\s*\(\s*(\d{1,4})\s*\))?/g;

/** `[[item:1000003|Selo]]`, `[[guia:…|Alma]]`, `[[mapa:tianyu|Tianyu]]`, `[[#galeria|Ver imagens]]` */
const WIKI_LINK_RE =
  /\[\[(?:(item|guia|mapa|npc):([^\]|#]+)(?:#([a-z0-9\-]+))?|#([a-z0-9\-]+))(?:\|([^\]]+))?\]\]/gi;

/** Bare internal paths like `/missoes/cidade-da-paz/alma-da-paz-eterna`. */
const PATH_LINK_RE =
  /(\/(?:missoes|mapas|database)\/[a-z0-9\-/_]+)/gi;

const BULLET_RE = /^\s*[•\-\*]\s+(.*)$/;

function parseCoord(match: RegExpExecArray): QuestCoord {
  return {
    x: Number(match[1]),
    y: Number(match[2]),
    altitude: match[3] != null ? Number(match[3]) : null,
  };
}

export function extractCoordsFromText(text: string): QuestCoord[] {
  const out: QuestCoord[] = [];
  const seen = new Set<string>();
  COORD_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = COORD_RE.exec(text)) !== null) {
    const c = parseCoord(m);
    const key = coordKey(c);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out;
}

function wikiHref(
  kind: string,
  target: string,
): string | null {
  const t = target.trim();
  if (kind === "item") {
    const id = Number(t);
    if (!Number.isFinite(id)) return null;
    return `/database/itens/${id}`;
  }
  if (kind === "npc") {
    const id = Number(t);
    if (!Number.isFinite(id)) return null;
    return `/database/npcs/${id}`;
  }
  if (kind === "mapa") {
    return `/mapas/${t.replace(/^\/+/, "")}`;
  }
  if (kind === "guia") {
    const clean = t.replace(/^\/+/, "").replace(/^missoes\//, "");
    return `/missoes/${clean}`;
  }
  return null;
}

function scrollToHash(hash: string) {
  const id = hash.replace(/^#/, "");
  if (!id) return;
  requestAnimationFrame(() => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
}

function AnchorLink({
  hash,
  children,
}: {
  hash: string;
  children: ReactNode;
}) {
  const href = hash.startsWith("#") ? hash : `#${hash}`;
  return (
    <a
      className="qg-wiki-link"
      href={href}
      onClick={(e) => {
        e.preventDefault();
        const url = `${window.location.pathname}${window.location.search}${href}`;
        window.history.replaceState(null, "", url);
        scrollToHash(href);
      }}
    >
      {children}
    </a>
  );
}

function renderCoordsInText(
  text: string,
  seen: Set<string>,
  keyPrefix: string,
): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  let i = 0;
  COORD_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = COORD_RE.exec(text)) !== null) {
    let start = m.index;
    let end = m.index + m[0].length;
    if (
      start > 0 &&
      text[start - 1] === "(" &&
      end < text.length &&
      text[end] === ")"
    ) {
      start -= 1;
      end += 1;
    }
    if (start > last) nodes.push(text.slice(last, start));
    const coord = parseCoord(m);
    seen.add(coordKey(coord));
    nodes.push(
      <CoordChip key={`${keyPrefix}-c-${coordKey(coord)}-${i++}`} coord={coord} />,
    );
    last = end;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function renderPathLinks(
  text: string,
  seen: Set<string>,
  keyPrefix: string,
): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  let i = 0;
  PATH_LINK_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = PATH_LINK_RE.exec(text)) !== null) {
    if (m.index > last) {
      nodes.push(
        ...renderCoordsInText(text.slice(last, m.index), seen, `${keyPrefix}-p${i}`),
      );
    }
    const path = m[1]!;
    nodes.push(
      <Link key={`${keyPrefix}-path-${i++}`} className="qg-wiki-link" to={path}>
        {path.replace(/^\/missoes\//, "").replace(/\//g, " · ")}
      </Link>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    nodes.push(
      ...renderCoordsInText(text.slice(last), seen, `${keyPrefix}-ptail`),
    );
  }
  return nodes;
}

function renderInline(text: string, seen: Set<string>): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  let i = 0;
  WIKI_LINK_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = WIKI_LINK_RE.exec(text)) !== null) {
    if (m.index > last) {
      nodes.push(
        ...renderPathLinks(text.slice(last, m.index), seen, `seg-${i}`),
      );
    }
    const kind = m[1]?.toLowerCase();
    const target = (m[2] || "").trim();
    const typedHash = m[3]?.trim();
    const bareAnchor = m[4]?.trim();
    const labelRaw = (m[5] || "").trim();
    const key = `w-${kind || "a"}-${target || bareAnchor}-${i++}`;

    if (bareAnchor) {
      nodes.push(
        <AnchorLink key={key} hash={bareAnchor}>
          {labelRaw || bareAnchor}
        </AnchorLink>,
      );
    } else if (kind) {
      const href = wikiHref(kind, target);
      const display = labelRaw || target;
      if (href && typedHash) {
        nodes.push(
          <Link
            key={key}
            className="qg-wiki-link"
            to={{ pathname: href, hash: `#${typedHash}` }}
            onClick={() => scrollToHash(`#${typedHash}`)}
          >
            {display}
          </Link>,
        );
      } else if (href) {
        nodes.push(
          <Link key={key} className="qg-wiki-link" to={href}>
            {display}
          </Link>,
        );
      } else {
        nodes.push(display);
      }
    } else {
      nodes.push(labelRaw || target || bareAnchor || "");
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    nodes.push(...renderPathLinks(text.slice(last), seen, `tail`));
  }
  return nodes;
}

type ListRow = {
  before: string;
  coord: QuestCoord | null;
  after: string;
};

function isCaveHint(after: string): boolean {
  return /^caverna\.?$/i.test(after.trim());
}

function CaveBadge() {
  return (
    <span className="qg-coord-cave" title="Caverna" aria-label="Caverna">
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path
          d="M2 13.5 5.2 7.8 7.1 10.2 9.6 5.5 14 13.5Z"
          fill="currentColor"
          opacity="0.9"
        />
        <path
          d="M6.2 13.5c.35-1.6 1.15-2.45 1.9-2.45s1.55.85 1.9 2.45"
          stroke="#1a1610"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

function parseListRow(raw: string): ListRow {
  COORD_RE.lastIndex = 0;
  const m = COORD_RE.exec(raw);
  if (!m) {
    return { before: raw.trim(), coord: null, after: "" };
  }
  const before = raw.slice(0, m.index).replace(/\s*[—–\-]\s*$/, "").trim();
  const after = raw
    .slice(m.index + m[0].length)
    .replace(/^\s*[—–\-]\s*/, "")
    .trim();
  return { before, coord: parseCoord(m), after };
}

function splitBlocks(text: string): Array<
  | { kind: "prose"; lines: string[] }
  | { kind: "list"; rows: string[] }
> {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: Array<
    | { kind: "prose"; lines: string[] }
    | { kind: "list"; rows: string[] }
  > = [];

  for (const line of lines) {
    const bullet = line.match(BULLET_RE);
    if (bullet) {
      const last = blocks[blocks.length - 1];
      if (last?.kind === "list") {
        last.rows.push(bullet[1]);
      } else {
        blocks.push({ kind: "list", rows: [bullet[1]] });
      }
      continue;
    }
    const last = blocks[blocks.length - 1];
    if (last?.kind === "prose") {
      last.lines.push(line);
    } else {
      blocks.push({ kind: "prose", lines: [line] });
    }
  }

  return blocks;
}

export function QuestRichText({
  text,
  fallbackCoords = [],
  npc = null,
  className = "qg-wiki-step-body",
}: {
  text: string;
  fallbackCoords?: QuestCoord[];
  npc?: string | null;
  className?: string;
}) {
  const seen = new Set<string>();
  const blocks = splitBlocks(text.trim());
  const nodes: ReactNode[] = [];

  for (let bi = 0; bi < blocks.length; bi++) {
    const block = blocks[bi];
    if (block.kind === "prose") {
      const prose = block.lines.join("\n").trim();
      if (!prose) continue;
      nodes.push(
        <p key={`p-${bi}`} className="qg-wiki-step-prose">
          {renderInline(prose, seen)}
        </p>,
      );
      continue;
    }

    const rows = block.rows.map(parseListRow);
    const hasAnyCoord = rows.some((r) => r.coord);
    const coordOnly =
      hasAnyCoord &&
      rows.length > 1 &&
      rows.every(
        (r) =>
          r.coord &&
          !r.before.trim() &&
          (!r.after.trim() || isCaveHint(r.after)),
      );
    nodes.push(
      <ul
        key={`l-${bi}`}
        className={[
          "qg-wiki-poi-list",
          hasAnyCoord ? "qg-wiki-poi-list--coords" : "",
          coordOnly ? "qg-wiki-poi-list--coords-grid" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {rows.map((row, ri) => {
          if (row.coord) seen.add(coordKey(row.coord));
          const cave = isCaveHint(row.after);
          return (
            <li key={`r-${bi}-${ri}`}>
              {row.before ? (
                <span className="qg-wiki-poi-label">
                  {renderInline(row.before, seen)}
                </span>
              ) : null}
              {row.coord ? <CoordChip coord={row.coord} /> : null}
              {cave ? <CaveBadge /> : null}
              {row.after && !cave ? (
                <span className="qg-wiki-poi-extra">
                  {renderInline(row.after, seen)}
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>,
    );
  }

  const orphanCoords = fallbackCoords.filter((c) => !seen.has(coordKey(c)));
  const npcAlreadyShown =
    Boolean(npc) && text.toLowerCase().includes(npc!.toLowerCase());

  if (orphanCoords.length > 0 || (npc && !npcAlreadyShown)) {
    nodes.push(
      <div key="meta" className="qg-wiki-step-meta">
        {npc && !npcAlreadyShown ? (
          <span className="qg-wiki-step-npc">{npc}</span>
        ) : null}
        {orphanCoords.length > 0 ? (
          <div className="qg-wiki-step-coords">
            {orphanCoords.map((c) => (
              <CoordChip key={coordKey(c)} coord={c} />
            ))}
          </div>
        ) : null}
      </div>,
    );
  }

  return <div className={className}>{nodes}</div>;
}

/** @deprecated Prefer QuestRichText — kept as alias for existing imports. */
export const QuestInstructionBody = QuestRichText;
