# Desenvolvimento local

## Pré-requisitos

- Node.js 20+
- pnpm 10+

## Comandos

```bash
pnpm install
pnpm --filter @hiperxp/drop-engine test
pnpm dev
```

Abre `http://localhost:5173`.

## Estrutura

| Caminho | Função |
|---|---|
| `apps/web` | Interface React (mapas + missões + database + simulador) |
| `packages/contracts` | Tipos e utilitários compartilhados |
| `packages/drop-engine` | Motor probabilístico + RNG |
| `data/fixtures` | Dados sintéticos (não publicar como reais) |
| `sources/` | Entradas brutas dos importadores (HTML do simulador e PNGs dos mapas) |
| `design/identidade` | Kit atual da marca; o site usa a cópia em `apps/web/public/brand` |
| `archive/identidade-v1` | Kit anterior, fora do app |
| `services/api` | API ainda não implementada |

## Rotas

- `/` — home
- `/mapas/cidade-da-paz` e `/mapas/tianyu`
- `/missoes` e `/missoes/:mapSlug` — listagem estilo blog (guias)
- `/missoes/:mapSlug/:questSlug` — post do guia com etapas
- `/database` — enciclopédia (itens + missões do cliente)
- `/database/itens/:id` e `/database/missoes/:id`
- `/simulador` e `/simulador/bau-da-aurora`

Regenerar guias: `python tools/build-quest-guides.py`

Database a partir do cliente:

```bash
python tools/extract-client-tasks.py
python tools/build-database-catalog.py
```

Ícones do Database em dev/preview vêm de `data/fixtures/sources/client-br-levelup/icons-all` via plugin Vite (`/database/icons/:id.png`).

Progresso de exploração fica no IndexedDB do navegador (exportar/importar JSON na toolbar do mapa).

Simulações longas rodam em Web Worker (`src/workers/simulate.worker.ts`) com progresso e cancelamento.
