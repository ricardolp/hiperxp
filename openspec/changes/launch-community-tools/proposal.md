# Why

Ferramentas comunitárias podem deixar de estar disponíveis e dispersam informações entre idiomas e versões do PW. Precisamos de uma base própria, revisável e exportável para exploração e simulação.

# What Changes

- Adicionar mapas interativos da Cidade da Paz e Tianyu, com coordenadas calibradas e progresso por personagem.
- Adicionar simulador de baús/pacotes com modelo explícito, revisão das taxas e reprodução por seed.
- Adicionar pipeline de extração local do cliente BR e importação de dados com procedência.
- Adicionar propostas comunitárias moderadas e publicação atômica de releases.
- Permitir uso público sem conta e sincronização opcional.

# Capabilities

## New Capabilities

- `interactive-maps`: mapas, filtros, coordenadas e cobertura.
- `exploration-progress`: personagens, conclusão e sincronização.
- `drop-simulator`: tabelas, sorteios, análise e exportação.
- `data-ingestion`: extração, validação, normalização e proveniência.
- `community-review`: contribuições, revisão e releases.
- `public-platform`: acesso, segurança, acessibilidade e operação.

## Modified Capabilities

Nenhuma: projeto novo.

# Impact

Frontend público, API Go, PostgreSQL, arquivos estáticos em CDN, importador local e console de revisão. Integração externa é opcional e restrita à obtenção revisada de dados; o site publicado não depende de disponibilidade de sites comunitários externos (ex.: PW Map). Não alterar o cliente nem disponibilizar o instalador completo do jogo.
