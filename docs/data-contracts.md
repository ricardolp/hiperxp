# Contratos e modelo de dados

Contratos versionados em JSON Schema, compartilhados com API e importador. IDs internos são UUIDs opacos; slugs são rotas e podem mudar com redirects. IDs nativos do jogo são strings com namespace, região, build e tipo; não são globalmente únicos por suposição.

| Entidade | Campos principais e restrições |
|---|---|
| game_builds | id, region, version_label, build_number nullable, client_hash, declared_at; desconhecido permanece null |
| sources | id, type, url/path sanitizado, language, captured_at, content_hash, reuse_status, attribution; sem caminho pessoal absoluto público |
| releases | id, schema_version, status, created_at, reviewer_id, manifest_hash; snapshots publicados imutáveis |
| maps | id estável, slug, name_pt_br, aliases, native_refs, timezone/reset_rule nullable |
| map_revisions | id, map_id, build_id, asset_id, transform, anchor_report, coverage_status, release_id |
| assets | id, object_key, sha256, width, height, media_type, reuse_status, source_id; MIME validado por conteúdo |
| points | id estável, map_id; identidade separada da revisão |
| point_revisions | point_id, release_id, map_revision_id, name, aliases, category, x, y, altitude nullable, instance_id nullable, zone, reset_policy, access_conditions, provenance, review_status |
| prerequisites | point_revision_id, type, target_native_ref nullable, description, source_id; texto quando referência não resolvida |
| items | id, native_refs, traduções, aliases, icon_asset_id nullable |
| drop_tables | id estável, slug, source_item_id nullable |
| drop_table_revisions | id, table_id, build_id, release_id, groups, probability_status, evidence, model_version, supported |
| characters | id, owner_id nullable no local, display_name, game_server nullable; nome não identifica conta do jogo |
| progress | character_id, point_id, period_id, completed, revision, updated_at; chave única character/point/period |
| contributions | id, author nullable para report, base_release, target, kind, patch, evidence, state, revision |
| reviews | contribution_id, reviewer_id, decision, rationale, created_at |
| import_batches | id, source_hash, parser_version, build_id, state, report, created_at; idempotência por fingerprint |
| audit_events | id, actor_id restrito, action, target, timestamp, revision; sem payload privado no feed público |

## Estados

- Contribuição: `draft -> submitted -> in_review -> approved | rejected | needs_changes`; approved não significa release publicado.
- Lote: `uploaded -> parsed -> validated -> review_required -> approved -> published`; falhas mantêm diagnóstico; rejeição não altera release ativo.
- Origem dos dados: `client_extracted`, `official_published`, `community_observed`, `third_party`, `synthetic`.
- Revisão: `pending`, `verified_br`, `foreign_reference`, `disputed`, `obsolete`.
- Probabilidades: `confirmed_for_build`, `client_declared_unverified_server`, `estimated`, `unknown`, `hypothetical`. Origem oficial deve ter evidência própria; não se infere pelo site que hospeda.
- Reutilização: `allowed`, `permission_pending`, `restricted`, `unknown`; publicação só de conteúdo autorizado ou próprio.

## Restrições

Coordenadas finitas, limites por mapa, altitude nullable sem padrão zero, IDs de fonte existentes, categorias permitidas e enum versionado. Precisão original preservada; arredondamento só para exibição. Duplicado suspeito gera revisão; não fundir automaticamente por texto/posição.

Probabilidades são frações inteiras; JSON usa números apenas no intervalo seguro, ou strings de inteiros para campos definidos como BigInt. Esquema proíbe mistura ambígua. Tabela exige grupos ordenados e limites de complexidade. Resultado armazena seed como string, revisões, N solicitado/processado e `completed|cancelled|failed`.

## Progresso exportado

Envelope: `format_version`, `exported_at`, `release_id`, `characters[]`, `states[]`. Estado inclui `character_id`, `point_id`, `period_id`, `completed` e `revision`. Proibir tokens, e-mail e identificadores de sessão. Importação cria cópias ou mescla por decisão; UUID de outro usuário nunca concede acesso. Campos desconhecidos com risco de perder estado pedem atualização do aplicativo em vez de ignorar silenciosamente.

## Compatibilidade

Ponto removido recebe tombstone e possível redirect manual. Divisão de um ponto em dois exige regra explícita: conclusão antiga não conclui automaticamente ambos. Estatísticas usam só pontos ativos do release e informam estados órfãos preservados. Progresso permanente usa `period_id=permanent`; diário usa ID estável do intervalo, calculado pelo calendário do servidor.
