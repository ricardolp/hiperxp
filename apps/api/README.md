# @hiperxp/api

API pública de leitura do catálogo Database + beacon de views.

```bash
# na raiz do monorepo
pnpm --filter @hiperxp/api dev
```

Variáveis: veja `.env.example`.

Rotas:

- `GET /health`
- `GET /api/v1/db/meta`
- `GET /api/v1/db/search`
- `GET /api/v1/db/categories`
- `GET /api/v1/db/popular`
- `GET /api/v1/db/items/:id` (+ `/links`)
- `GET /api/v1/db/quests/:id`
- `GET /api/v1/db/recipes/:id`
- `GET /api/v1/db/npcs/:id`
- `POST /api/v1/db/view`
