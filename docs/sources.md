# Fontes e estado da investigação

Consulta em 23/11/2026. Acessar uma página não confirma disponibilidade de todo o dataset ou permissão de reprodução. Não foram baixados assets nem importadas coordenadas ou taxas reais.

| Fonte | Finalidade | Resultado / limite |
|---|---|---|
| https://pw-map.ru/pokoi | Mapa russo da Cidade da Paz | Importado: imagem + 571 pontos (`cidade-da-paz`) via `/api/regions/pokoi` e `/points?region_id=1` |
| https://pw-map.ru/tianyuy | Mapa russo de Tianyu | Importado: imagem + 422 pontos (`tianyu`) |
| https://pw-map.ru/czinsyuan | Mapa russo de Jingxuan | Importado: imagem + 474 pontos (`jingxuan`); UX de referência do Reino Oriental |
| https://pwonline.ru/forums/showthread.php?t=217872 | Guia citado como origem pelo PW Map | Link encontrado; leitura retornou 403; conteúdo não verificado |
| https://pwi.fandom.com/wiki/Eastern_Continent/City_of_Peace_Exploration | Exploração em inglês | Índice de busca menciona mapa interativo; página completa não acessível na consulta |
| https://triviapw.com.br/2025/11/19/localizacoes-do-mapa-reino-oriental/ | Referência de UX e termos BR | Consulta retornou estrutura de filtros/progresso e comentários; não valida funcionamento integral atual |
| https://triviapw.com.br/2025/10/31/missoes-da-cidade-da-paz-eterna-guia-completo/ | Índice das 17 missões globais (BR) | Nomes e links individuais; corpo HTML às vezes omitido no fetch automatizado |
| https://vk.com/@-149459137-mirovye-kvesty-vostochnyh-zemel | Guia completo RU das 17 histórias | Texto integral com coords/diálogos; base de `data/fixtures/quests/cidade-da-paz.json` |
| https://triviapw.com.br/2026/05/21/cidade-de-tianyu-jornadas/ | Índice das jornadas de Tianyu | 5 jornadas + desafios auxiliares; fixtures em `data/fixtures/quests/tianyu.json` |
| `client-br-levelup` / `elements.data` | Itens + receitas do cliente BR | ~43k itens (+ ícones); ~12k receitas (lista 68 RECIPE_ESSENCE) via `extract-client-recipes.py`; catálogo em `/database` |
| `client-br-levelup` / `tasks.data` | Missões do cliente BR | ~26k missões (v237) com textos/recompensas/premissas/séries via `extract-client-tasks.py`. NPCs ainda pendentes |
| https://github.com/ipasetto/MyAceEditor | Referência de formatos do cliente | README documenta formatos e GPL-3.0; compatibilidade com build do usuário não testada |
| https://github.com/nbshelton/pw-resource | Referência de importação | README documenta loader de elements.data; revisar licença e compatibilidade antes de reutilizar |
| https://github.com/Kn1fe/DataTranslator | Referência de tradução | Projeto documenta elements.data/tasks.data e Apache-2.0; não testado localmente |
| https://leafletjs.com/reference.html | Renderer de mapa | Documentação oficial consultada; escolher API estável compatível na implementação |
| https://github.com/Fission-AI/OpenSpec | Estrutura da proposta | Organização oficial por proposta, design, tarefas e specs |
| https://raw.githubusercontent.com/Fission-AI/OpenSpec/main/docs/concepts.md | Sintaxe de requisitos | Requisitos SHALL e cenários WHEN/THEN; deltas em mudança proposta |

## Aviso de reutilização

Imagens e coordenadas de `pw-map.ru` estão em `apps/web/public/maps/*.webp` e `data/fixtures/maps/*.json` com `origin: third_party` e `review_status: foreign_reference`. Uso atual é para desenvolvimento/referência; republicação pública permanente depende de autorização ou substituição por assets do cliente BR.

Reimportar: `node tools/import-pw-map.mjs` (após atualizar dumps em `data/fixtures/sources/`).

Guias de missão: `python tools/build-quest-guides.py` → `data/fixtures/quests/{cidade-da-paz,tianyu}.json`. Fontes brutas em `data/fixtures/sources/quest-guides/`.
Saga do Herói (16+ classes): `python tools/build-hero-sagas.py` → `data/fixtures/quests/mundo-normal.json`.
Prioridade BR: `data/fixtures/sources/quest-guides/br-saga/*.md` (Trivia/Wiki via índice Google). Fallback EN: `perfect-world-hero-saga.pwpedia.txt`.

## O que ainda precisa ser comprovado

- Equivalência entre Cidade da Paz / Tianyu / Jingxuan e nomes oficiais do cliente BR.
- Escopo e extensão exata dos pontos disponíveis na versão BR.
- Arquivos e versão do parser que permitem obter imagens, descrições e posições.
- Origem e completude dos pontos russos; condição de reutilização e possíveis diferenças de build.
- Tabela, semântica e origem das probabilidades dos baús prioritários.
- Horário de reset, calendário por servidor e totais de exploração do jogo.

Estas pendências impedem afirmar que a base real já está pronta. Não impedem implementar arquitetura, UI e motor com fixtures isoladas.
