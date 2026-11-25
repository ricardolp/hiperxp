<p align="center">
  <img src="apps/web/public/brand/logos/hiperxp-colorida-240w.png" alt="HiperXP" width="220" />
</p>

<h1 align="center">HiperXP</h1>

<p align="center">
  <strong>Ferramentas da comunidade para Perfect World</strong><br />
  Mapas interativos, guias de missões e simulador de baús — em português, gratuito e open source.
</p>

<p align="center">
  <a href="https://hiperxp.com">Site</a> ·
  <a href="https://github.com/ricardolp/hiperxp">GitHub</a> ·
  <a href="#contribuir">Contribuir</a> ·
  <a href="#licença">MIT</a>
</p>

<p align="center">
  <img alt="Licença MIT" src="https://img.shields.io/badge/licença-MIT-red?style=flat-square" />
  <img alt="Idioma" src="https://img.shields.io/badge/idioma-pt--BR-blue?style=flat-square" />
  <img alt="Stack" src="https://img.shields.io/badge/stack-React%20%2B%20Vite%20%2B%20TypeScript-black?style=flat-square" />
</p>

---

## Uma iniciativa da comunidade

O **HiperXP** nasceu para facilitar a vida de quem joga Perfect World no servidor brasileiro: descobrir pontos no Reino Oriental, acompanhar missões e entender chances de baús — sem login forçado, sem automação e sem depender da conta do jogo.

É um projeto de fãs, **independente** da Level Up / Perfect World Entertainment. Não somos afiliados, endossados ou patrocinados pelo jogo oficial. Conteúdo de referência, progresso local no navegador e simulação isolada do cliente.

Se você curte mapas, guias ou dados do PW, este repositório é um convite para construir junto.

## O que o site oferece

| Área | O que faz |
|---|---|
| **Mapas** | Cidade da Paz, Tianyu e Jingxuan com pan/zoom, filtros, coordenadas e checklist por personagem |
| **Missões** | Guias das histórias do Reino Oriental, com etapas e coords em português |
| **Simulador** | Abertura de baús/pacotes com motor local (Web Worker), seed e exportação |

Progresso de exploração fica no **IndexedDB** do navegador (exportar/importar na toolbar do mapa). A simulação **não** conecta à sua conta nem altera o jogo.

## Rodar localmente

```bash
pnpm install
pnpm dev
```

Abre em `http://localhost:5173`. Detalhes em [`docs/dev.md`](./docs/dev.md).

```bash
pnpm test        # pacotes
pnpm build       # build de produção
pnpm typecheck
```

## Estrutura do monorepo

| Caminho | Função |
|---|---|
| `apps/web` | Interface (mapas, missões, simulador) |
| `packages/contracts` | Tipos e utilitários compartilhados |
| `packages/drop-engine` | Motor probabilístico + RNG |
| `data/fixtures` | Dados de desenvolvimento / referência |
| `design/identidade` | Kit da marca |
| `docs/` | Contratos, fontes, importação e aceite |
| `openspec/` | Proposta e requisitos do lançamento |
| `tools/` | Importadores e scripts de build |

## Atribuições e referências

O HiperXP se apoia no trabalho da comunidade internacional e brasileira. Em especial:

### Mapas — [pw-map.ru](https://pw-map.ru)

Referência principal de layout, pontos e arte dos mapas do Reino Oriental (uso atual marcado como referência estrangeira; republicação permanente depende de autorização ou assets do cliente BR):

| Região | Link de referência |
|---|---|
| Cidade da Paz | [pw-map.ru/pokoi](https://pw-map.ru/pokoi) |
| Tianyu | [pw-map.ru/tianyuy](https://pw-map.ru/tianyuy) |
| Jingxuan | [pw-map.ru/czinsyuan](https://pw-map.ru/czinsyuan) |

Guia citado pelo PW Map: [pwonline.ru — thread de exploração](https://pwonline.ru/forums/showthread.php?t=217872).

### Guias e termos BR — Trivia PW

Índices e guias em português usados como base de nomes, jornadas e UX:

- [Localizações do mapa Reino Oriental](https://triviapw.com.br/2025/11/19/localizacoes-do-mapa-reino-oriental/)
- [Missões da Cidade da Paz Eterna](https://triviapw.com.br/2025/10/31/missoes-da-cidade-da-paz-eterna-guia-completo/)
- [Cidade de Tianyu — jornadas](https://triviapw.com.br/2026/05/21/cidade-de-tianyu-jornadas/)

### Nomes e comunidade BR

Fontes para alinhar nomenclatura, termos oficiais e conversa da comunidade:

| Fonte | Uso |
|---|---|
| [Discord Darkanas](https://discord.gg/sssUV8eETW) · [YouTube @Darkanas](https://www.youtube.com/@Darkanas/posts) | Comunidade / posts — nomes e referências BR |
| [Discord oficial Level Up](https://discord.com/invite/pwlup) | Canal oficial — nomenclatura e avisos do servidor BR |

### Outras referências

| Fonte | Uso |
|---|---|
| [VK — missões mundiais das terras orientais](https://vk.com/@-149459137-mirovye-kvesty-vostochnyh-zemel) | Texto completo das 17 histórias (RU) |
| [PWI Fandom — City of Peace](https://pwi.fandom.com/wiki/Eastern_Continent/City_of_Peace_Exploration) | Índice de exploração em inglês |
| [MyAceEditor](https://github.com/ipasetto/MyAceEditor) | Formatos do cliente |
| [pw-resource](https://github.com/nbshelton/pw-resource) | Loader de `elements.data` |
| [DataTranslator](https://github.com/Kn1fe/DataTranslator) | `elements.data` / `tasks.data` |
| [Leaflet](https://leafletjs.com/) | Renderer dos mapas |
| [OpenSpec](https://github.com/Fission-AI/OpenSpec) | Organização da proposta |

Inventário completo, limites e pendências: [`docs/sources.md`](./docs/sources.md).

> Perfect World e marcas relacionadas pertencem aos seus respectivos donos. Assets do jogo e conteúdo de terceiros **não** estão cobertos pela licença MIT deste repositório.

## Documentação

- [`PRODUCT.md`](./PRODUCT.md) — escopo e critérios de produto
- [`docs/data-contracts.md`](./docs/data-contracts.md) — contratos de dados
- [`docs/drop-engine.md`](./docs/drop-engine.md) — regras do simulador
- [`docs/client-import.md`](./docs/client-import.md) — extração local e publicação
- [`docs/api.md`](./docs/api.md) — endpoints previstos
- [`docs/acceptance.md`](./docs/acceptance.md) — plano de verificação
- [`openspec/changes/launch-community-tools/`](./openspec/changes/launch-community-tools/) — proposta, design e tarefas

## Contribuir

Toda ajuda é bem-vinda: correção de coordenada, guia de missão, melhoria de UX, parser do cliente ou documentação.

1. Abra uma [issue](https://github.com/ricardolp/hiperxp/issues) ou um pull request
2. Prefira mudanças pequenas e revisáveis
3. Não envie assets oficiais do jogo sem permissão clara
4. Contribuições de dados devem trazer **fonte** e, quando possível, evidência

Repositório: [github.com/ricardolp/hiperxp](https://github.com/ricardolp/hiperxp)

## Licença

O **código** deste repositório é distribuído sob a [licença MIT](./LICENSE).

Imagens, coordenadas de referência de terceiros, conteúdo importado do jogo e fontes tipográficas (OFL) seguem os termos dos respectivos autores — ver [`docs/sources.md`](./docs/sources.md) e `apps/web/public/brand/README.md`.

---

<p align="center">
  Feito pela comunidade, para a comunidade · Perfect World BR
</p>
