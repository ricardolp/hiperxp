# Context

Os dois mapas possuem referências russas, mas o carregamento dos pontos não foi confirmado. O cliente BR está no computador do proprietário e não foi inspecionado. Extração e correspondência de versões são riscos de dados a resolver, não funcionalidades já prontas.

# Goals / Non-Goals

Objetivo: entregar mapas úteis e simulações transparentes com base persistente própria. Fora do objetivo: reproduzir o servidor, automatizar o jogo, garantir lucros ou publicar taxas inferidas como oficiais.

# Decisions

## Arquitetura

Monorepo com `apps/web`, `services/api`, `tools/client-extractor`, `packages/contracts`, `packages/drop-engine`, `data/fixtures` e `infra`. React/Vite/TypeScript + shadcn/ui no frontend; Go na API e pipeline; PostgreSQL para metadados/progresso/moderação; assets e snapshots imutáveis em armazenamento de objetos/CDN. O extrator pode usar adaptador separado em C# quando um parser compatível justificar; contrato de saída JSON continua independente de linguagem.

Leaflet com CRS.Simple para coordenadas planas de imagem; não usar latitude/longitude terrestre. Isolar renderer e transformação em módulos testáveis. Escolher release estável e compatível das dependências no início, fixar versões e lockfiles. OpenAPI 3.1 e JSON Schema para contratos; geração de cliente TS pode ser adicionada.

Servir metadados públicos cacheáveis por release/ETag. O frontend fixa o mesmo release em todas as consultas de uma sessão. Uploads e processamento local não passam pelo caminho de leitura pública.

## Mapa e calibração

Cada mapa tem ID estável interno, referências de IDs do jogo por build, aliases, dimensões da imagem, revisão de assets e transformação. Não presumir que “Cidade da Paz” seja tradução oficial brasileira sem validação no cliente; manter o nome solicitado como nome de exibição provisório.

Coordenada canônica é (x, y, altitude opcional, map_id, build). Coordenada da imagem é (u, v), origem superior esquerda. Transformação afim u=a*x+b*y+c; v=d*x+e*y+f; inversa somente quando determinante não nulo. Verificar eixo invertido e escala do cliente. Pelo menos três âncoras não colineares para ajuste e duas independentes para conferência em cada mapa. Aceite: erro máximo <=2 unidades de coordenada do jogo nas âncoras independentes; documentar erro e resolução. Quando uma região exigir transformação não afim, não publicar com a aproximação inválida: dividir por zona ou especificar novo transformador.

Pontos próximos em altitude continuam distintos. Desduplicação nunca usa somente nome ou x/y. Tipo, instância, requisito e build participam da decisão humana. Filtros usam dados normalizados e índice de busca textual; ícones variam por categoria. Para alta densidade usar canvas/cluster e consulta por viewport, mantendo a lista navegável.

## Progresso

IndexedDB é a fonte local, com UUIDs de personagem e ponto estável. Persistir conclusão antes de atualizar a confirmação visual. Exportação inclui versão do formato e referências do release; importação valida tamanho, esquema e ownership, apresenta resumo e não apaga dados existentes implicitamente. Reset exige confirmação com escopo explícito.

Conta opcional sincroniza via API. Cada alteração recebe operation_id único e base_revision; concorrência retorna conflito, sem sobrescrever silenciosamente. UI oferece manter local, remoto ou mesclar por ponto após revisar conflitos. Login exige escolha de mesclagem antes de enviar progresso local a uma conta. Personagens locais não provam identidade no jogo. Estatísticas são pessoais.

Ponto diário usa chave period_id calculada pelo calendário configurado do servidor; se desconhecido, apenas reset manual e aviso. Separar diário de permanente. Migração de release mantém IDs e registra redirects/tombstones de pontos removidos. Não reutilizar IDs removidos para outro ponto.

## Motor de drops

Motor TS puro em pacote independente; Web Worker coordena execução, orçamento e cancelamento. Implementar PRNG determinístico documentado e versionado (ex.: PCG32 com estado de 64 bits usando BigInt); selecionar inteiro uniforme por rejection sampling, evitando viés do módulo. Seed ausente é criada com Web Crypto e depois armazenada no resultado. Não é sistema de aposta nem serviço de sorteio com valor econômico.

Tabela é árvore acíclica de grupos e recompensas. Aceitar somente tipos explicitamente suportados; não executar código vindo dos dados. Precisão inteira, sem normalizar silenciosamente probabilidades. Quantidades fixas no MVP. Grupos aninhados aceitos apenas se esquema declarar sorteios e retorno; ciclos e modelo sem semântica são rejeitados. Detalhes e matemática em `docs/drop-engine.md`.

Reprodução requer engine_version, rng_version, seed, table_revision, ordem canônica de grupos/entradas, count e parâmetros. Snapshot/export preserva todos. Metadados de usuário, custo e preços não alteram RNG.

## Importação e publicação

Originais locais somente leitura. Manifesto com hash, tamanho, versão do parser e build declarado/detectado. Parser desconhecido falha antes de publicar. Staging guarda entradas brutas permitidas, normalizadas, erros, evidências e diff. Nenhuma aprovação de código ou licença da ferramenta equivale a permissão de republicação dos assets do jogo.

Publicação usa transação para validar referências e trocar o ponteiro de release ativo depois que assets estiverem disponíveis. Invalidar cache do ponteiro; manter snapshots anteriores. Rollback troca ponteiro e não altera progresso do usuário. Escritas concorrentes usam revisão esperada/If-Match. Revisão autorizada e trilha append-only para ações de publicação.

## Segurança e operação

Sessões HttpOnly/Secure/SameSite, proteção CSRF nas mutações com cookie e CORS restrito. Segredos apenas no backend. Autorização por objeto para personagens, progresso, contribuições privadas e administração. Markdown sanitizado sem HTML arbitrário. Links de evidência não são buscados automaticamente no backend; futura busca requer proteção SSRF. Limites de tamanho, tempo, profundidade e descompressão nos imports.

Backups diários do banco, versionamento de objetos, restauração exercitada em homologação. Logs sem tokens, e-mails ou progresso detalhado; IDs de correlação, métricas de falha de importação/sincronização e tempo de resposta. Separar fixtures sintéticas de produção e bloquear publicação delas.

# Risks / Trade-offs

- Cliente pode não conter probabilidades efetivas e condições do servidor: exigir outra evidência ou marcar desconhecido.
- RU e BR podem divergir: fonte estrangeira não promove automaticamente status para validado BR.
- Open source proposto para código novo não cobre imagens, conteúdo importado ou código copiado com outra licença.
- Guest local é simples e livre, mas limpar navegador perde progresso sem exportação; informar onde está salvo.
- Não mostrar total “100% do jogo” quando existe somente total de pontos cadastrados.

# Migration Plan

Começar por fixtures, depois importar staging, calibrar ambos os mapas, validar baú real, revisar release e publicar beta. Upgrade de schema preserva identificadores e versões. Gates detalhados em `docs/acceptance.md`.

# Open Questions

Confirmar build/região do cliente, nomes oficiais de cada área, timezone/reset do servidor, inventário total de exploração e baús prioritários. Definir nome/domínio, autenticação e hospedagem durante implantação. Pendências não autorizam preenchimento fictício.
