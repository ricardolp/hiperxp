# Contrato HTTP proposto

Base `/api/v1`, JSON UTF-8, timestamps RFC3339 em UTC, UUIDs, paginação por cursor opaco. Definir OpenAPI 3.1 durante implementação. Requisições públicas não recebem dados pessoais. Campos e exemplos deste documento são proposta, não API existente.

| Método e rota | Acesso | Comportamento |
|---|---|---|
| GET /releases/current | Público | Retorna ponteiro, versão de schema e ETag |
| GET /releases/:id | Público | Manifesto imutável e cobertura |
| GET /maps?release_id= | Público | Somente as regiões publicadas; MVP com dois mapas |
| GET /maps/:slug?release_id= | Público | Metadados, transformação e assets |
| GET /maps/:slug/points | Público | release_id obrigatório; bbox, categorias, query, cursor; limite <=500 |
| GET /points/:id?release_id= | Público | Detalhes, evidências públicas e condições de acesso |
| GET /drop-tables?release_id= | Público | Catálogo com status das probabilidades |
| GET /drop-tables/:id/revisions/:revision | Público | Snapshot completo validado, imutável |
| GET /sources/:id | Público | Metadados permitidos, sem caminho local pessoal |
| GET /changelog | Público | Mudanças por release |
| GET/POST /me/characters | Conta | Listar/criar personagens próprios |
| PATCH/DELETE /me/characters/:id | Conta | Editar/remover com revisão esperada |
| GET /me/characters/:id/progress | Conta | Leitura paginada por personagem autorizado |
| POST /me/characters/:id/progress/batch | Conta | Operações idempotentes com base_revision; lote <=500 |
| GET /me/export | Conta | Exportar dados pessoais |
| DELETE /me | Conta | Exclusão confirmada; revoga sessões |
| POST /reports | Público limitado | Relato de erro sem anexos; protocolo não enumerável |
| POST /contributions | Conta | Proposta tipada, release-base e evidência |
| GET /me/contributions | Conta | Propostas próprias |
| GET /review/contributions | Revisor | Fila com diff e evidências |
| POST /review/contributions/:id/decision | Revisor | Aprovar/rejeitar/devolver, impedindo autoaprovação |
| POST /admin/imports | Admin | Upload autorizado, staging assíncrono |
| GET /admin/imports/:id | Admin | Estado e relatório |
| POST /admin/releases | Admin | Preparar candidato a partir de lote/propostas aprovadas |
| POST /admin/releases/:id/publish | Admin | Publicação atômica com revisão esperada |
| POST /admin/releases/:id/activate | Admin | Rollback auditado para snapshot anterior |

## Regras transversais

- Erro: `{code,message,request_id,details}`; não incluir stack trace, SQL ou caminho privado. 400 inválido, 401 sem sessão, 403 sem permissão, 404 ausente, 409 conflito, 413 grande, 422 modelo semântico inválido, 429 limite, 503 temporário.
- GETs públicos usam ETag/cache; assets por hash recebem cache imutável. Ponteiro de release possui cache curto, com revalidação. Não misturar pontos de um release com transformação de outro.
- Autorização revalidada na API; esconder botão no frontend não é controle suficiente.
- Mutações sensíveis usam If-Match ou base_revision, além de Idempotency-Key/operation_id. Repetição da mesma chave e payload retorna o mesmo resultado; payload diferente com chave repetida retorna conflito. Unicidade e retenção de idempotência documentadas (mínimo sete dias para sincronização).
- Lote de progresso é atômico; conflitos devolvem quais revisões divergem sem aplicar parte silenciosamente. Cliente divide lotes maiores e acompanha confirmação por lote.
- Limite inicial: leitura pública 120 req/min/IP, reports 5/h/IP, contribuição 20/h/conta, import administrativo 2 simultâneos. Ajustar com telemetria; não bloquear funcionamento normal da UI por cada marcador exigir chamada própria.
- Não existe endpoint de simulação pública no MVP: execução local reduz custo e exposição a abuso. Resultado compartilhado pode ser arquivo exportado; link do simulador compartilha parâmetros permitidos, sem progresso pessoal.
- A busca global de pontos usa o dataset do release, não somente os pontos já carregados na viewport.
