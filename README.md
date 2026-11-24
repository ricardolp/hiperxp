# PW Comunidade — mapas e simulador de drops

Especificação de produto e implementação • 23/11/2026 • versão 1.0

Nome provisório, sem identidade visual ou domínio definidos.

## Objetivo

Criar um site público, gratuito e em português para jogadores de Perfect World, começando pelos mapas interativos da **Cidade da Paz** e **Tianyu**, com acompanhamento de exploração por personagem, e por um **simulador de abertura de baús e pacotes**. Preparar a estrutura para outras fontes de drop, sem presumir que a fórmula de monstros seja igual à de baús.

O usuário dispõe do cliente no próprio computador. Este pacote especifica uma ferramenta local de extração, mas não acessa esse computador nem contém arquivos extraídos, imagens do jogo, coordenadas verificadas ou tabelas reais de drops. Os exemplos são explicitamente sintéticos.

## O que está incluído

- `PRODUCT.md`: escopo, experiência, decisões e critérios de lançamento.
- `openspec/changes/launch-community-tools/`: proposta, desenho técnico, tarefas e requisitos com cenários de aceitação.
- `docs/data-contracts.md`: contratos de dados, identidade, versões e exemplos.
- `docs/drop-engine.md`: regras probabilísticas e casos de referência.
- `docs/client-import.md`: extração local e publicação revisada.
- `docs/api.md`: endpoints e regras de concorrência.
- `docs/sources.md`: fontes consultadas, limitações e pendências.
- `docs/acceptance.md`: plano de verificação e condições de lançamento.
- `examples/`: dados artificiais para orientar implementação; proibido publicar como dados reais.

## Como usar a OpenSpec

Esta é uma proposta ainda não implementada. Os requisitos ficam em `openspec/changes/launch-community-tools/specs/`, sob `## ADDED Requirements`. A pasta `openspec/specs/` deve receber a especificação vigente somente quando a mudança for implementada e arquivada. Não marcar tarefas como feitas só porque estão descritas.

O pacote segue a organização documentada pelo projeto OpenSpec: `proposal.md`, `design.md`, `tasks.md` e especificações por capacidade. A validação oficial da CLI deve ser executada no ambiente de implementação; este pacote não afirma ter sido validado por uma versão instalada da CLI.

## Decisões assumidas

| Tema | Decisão inicial |
|---|---|
| Público | Comunidade do PW brasileiro oficial |
| Idioma | pt-BR, com aliases estrangeiros preservados |
| Mapas do MVP | Cidade da Paz e Tianyu, cada um independente |
| Simulador | Baús/pacotes; drops de monstros somente após fórmula comprovada |
| Cadastro | Opcional; consulta e simulação livres |
| Progresso | Local por personagem; sincronização opcional com conta |
| Stack proposta | Go, PostgreSQL, React + Vite + TypeScript + shadcn/ui; Leaflet |
| Dados | Origem, versão, cobertura e revisão visíveis |
| Publicação | Releases imutáveis; sem depender de sites externos em tempo de uso |
| Código aberto | Intenção de repositório público; MIT proposta para código novo |

## Desenvolvimento

Scaffold inicial disponível: monorepo com interface dos dois mapas, progresso local e simulador sobre fixtures sintéticas. Ver `docs/dev.md`.

```bash
pnpm install
pnpm dev
```

A publicação de dados reais ainda depende da investigação do cliente BR e da calibração dos mapas. Não tratar fixtures como conteúdo oficial do jogo.

## Contribuir

Código aberto em [github.com/ricardolp/hiperxp](https://github.com/ricardolp/hiperxp). Issues e pull requests são bem-vindos.

## Licença

O código deste repositório é distribuído sob a [licença MIT](./LICENSE). Imagens, conteúdo importado do jogo e assets de terceiros podem ter termos próprios e não estão cobertos pela MIT.
