# Database catalog no Postgres

O módulo **Database** (itens / missões / recipes / NPCs / mais vistos) usa um banco Postgres dedicado `hiperxp`. Mapas, guias, drops e progresso local **não** dependem desse banco.

## Por que separado do Umami

Mesma **instância** Postgres no Railway é ok (barato). Use outro **database name** (`hiperxp`), nunca as tabelas do Umami.

```sql
CREATE DATABASE hiperxp;
```

## Setup

1. Criar o database `hiperxp` na instância.
2. Aplicar schema + importar fixtures:

```bash
export DATABASE_URL='postgresql://USER:PASS@HOST:5432/hiperxp'
# opcional na Railway:
# export DATABASE_SSLMODE=require

pip install 'psycopg[binary]'
python tools/import-database-pg.py --apply-schema
```

3. Subir a API:

```bash
pnpm --filter @hiperxp/api dev
# DATABASE_URL e CORS_ORIGINS via apps/api/.env
```

4. Front (opcional — sem isso, continua no JSON estático):

```bash
# apps/web/.env
VITE_DATABASE_API_URL=http://localhost:4000
```

Se a API/Postgres estiver fora, o site sobe normalmente; só o Database tenta fallback JSON ou mostra indisponível.

## Segurança

- Superfície pública: só `GET/POST /api/v1/db/*` (sem dump completo, `limit` ≤ 50).
- Rate limit por IP; `POST /view` com dedupe por IP+entidade.
- CORS restrito a origens do site.
- Import só via script/CI com `DATABASE_URL` (não há endpoint de write de catálogo).

## Arquivos

| Artefato | Onde |
|---|---|
| Catálogo JSON | `data/fixtures/database/` → import Postgres; `public/database/` = fallback |
| Ícones | estáticos `/database/icons/{id}.png` (não no Postgres) |
| Schema | `infra/postgres/001_schema.sql` |
| API | `apps/api` |
