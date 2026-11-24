# Importação do cliente e fontes externas

## O que sabemos

O proprietário tem o cliente no computador. Não foi acessado nem identificado o build. As ferramentas comunitárias consultadas documentam formatos como `elements.data`, `tasks.data` e `.pck`, mas isso não confirma compatibilidade com o cliente disponível.

## Etapas locais

1. Selecionar a pasta manualmente na ferramenta local e informar região/versão exibida no launcher. Não pedir login do jogo.
2. Fazer inventário por allowlist de arquivos de dados e assets; registrar tamanho/hash SHA-256 e build detectado/declarado. Excluir logs, screenshots pessoais, credenciais e configurações de conta.
3. Trabalhar sobre cópias em pasta de saída separada. Nunca modificar ou iniciar o cliente e nunca ler memória de processo.
4. Detectar assinatura/versão do formato antes de escolher adaptador. Versão não suportada resulta em erro claro, sem heurística silenciosa para offsets binários.
5. Extrair primeiro IDs, nomes, descrições e relações demonstráveis. Localizar texturas/tiles dos mapas e verificar permissão de uso. Converter formato de imagem apenas com ferramenta segura e dentro dos limites.
6. Itens: `tools/extract-client-items.py` → `items.all.json`. Missões: `tools/extract-client-tasks.py` → `quests.all.json`. Receitas: `tools/extract-client-recipes.py` → `recipes.all.json` (lista 68 / RECIPE_ESSENCE no BR v0x25a). NPCs: `tools/extract-client-npcs.py` → `npcs.all.json` (lista 57 / hello + serviços). Lojas: `tools/extract-client-npc-shops.py` → `shops.all.json` (lista 40 / sell — itens que o jogador compra). Catálogo público: `tools/build-database-catalog.py` → `apps/web/public/database/`.
7. Coordenadas de mundo **não** estão no NPC_ESSENCE; o cliente BR local não tem `npcgen*`. Spawns exigem outra fonte (servidor/mapa autorizado).
8. Extrair tabelas candidatas de recompensas com semântica bruta e proveniência. Se o cliente só mostrar recompensas possíveis, não inventar probabilidades. Configuração efetiva de servidor pode ser diferente ou ausente.
9. Produzir pacote JSON + assets autorizados + manifesto + relatório de avisos. Inspecionar conteúdo permitido antes do upload.

Database (estado atual): itens + missões + craft + NPCs (hello/serviços) + lojas (lista 40). Ainda aberto: coordenadas de NPC (npcgen) e descrições longas de item (parciais).

Pipeline local (sem AI): `python tools/run-database-pipeline.py --list` · `--all-ready --skip-descriptions` · `--only descriptions -- --resume`. Crawl longo de textos: `python tools/fetch-cotacao-descriptions.py --resume`.

Comando conceitual de ferramenta a implementar: `pw-extract inspect --client-dir <pasta> --out <pasta-separada>` e `pw-extract export --manifest <manifesto> --out <pacote>`. Não são comandos disponíveis neste pacote.

## Referências técnicas

- PWResource: referência de loader elements.data; revisar licença antes de reutilizar código.
- MyAceEditor: referência de formatos; GPL-3.0 documentada. Adaptador derivado deve respeitar a licença; não incorporar indiscriminadamente a um pacote MIT.
- DataTranslator: referência de tradução e mapeamento; Apache-2.0 documentada.

Código reutilizado, ferramenta executada separadamente e dados extraídos têm condições distintas. Registrar SBOM/NOTICE se incorporar dependências. Código novo pode ser MIT; dados e assets exigem avaliação independente.

## Importação de PW Map / guias

Mapas de referência: `https://pw-map.ru/pokoi` e `https://pw-map.ru/tianyuy`. Tentar obter dados públicos documentados ou autorização do responsável. Não depender de scraping em toda visita do usuário. Se houver JSON público, preservar estrutura original, fonte, data, hash e condição de reutilização. Não contornar autenticação ou mecanismos de acesso.

Traduzir com glossário pt-BR validado contra cliente. Guardar nome original RU/EN como alias e tradução ainda não revisada com status correspondente. Mesclar por referências verificadas; igualdade de IDs ou semelhança de nomes não é prova suficiente entre versões.

## Staging e validação

- Limites iniciais de upload administrativo: 100 MB compactados, 500 MB expandidos, 20.000 arquivos; bloquear path traversal, symlinks, executáveis e zip bombs. Configuração pode ser ajustada após inventário real.
- Sanitizar texto; rejeitar NaN, infinitos, coordenadas fora dos limites, IDs repetidos e referências inexistentes.
- Manifesto exige `format_version`, `source_kind`, build, tool/parser_version, hashes e declaração de conteúdo sintético.
- Mostrar diff por entidade: novo, alterado, removido e conflito. Remoção só vira tombstone após revisão; arquivo faltante não autoriza apagar pontos.
- Calibrar os dois mapas separadamente; verificar pelo menos dez pontos de cada mapa no jogo além das âncoras de calibração.
- Distinguir conteúdo observado e condição de acesso, principalmente cavernas, missões, altitude e estados de mapa.
- Publicar apenas após revisão de proveniência e condição de uso. Manter alternativa com assets próprios quando necessário.

## Dados mínimos para iniciar

Build/região do cliente; imagem utilizável de cada região; âncoras verificáveis; amostra de pontos por categoria disponível; um baú escolhido com tabela e semântica verificáveis. Inventário pode mostrar que será necessário obter taxas publicadas externamente. Essa descoberta não impede desenvolver o restante com fixtures claramente sintéticas.
