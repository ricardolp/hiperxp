# Verificação e lançamento

## Estado deste pacote

Documentação e fixtures de especificação. Não há aplicação implementada, extração realizada, taxas reais validadas ou mapa publicado. Validar estrutura textual e JSON do pacote não substitui os testes do produto.

## Evidências obrigatórias para lançamento

| Área | Evidência / aceitação |
|---|---|
| Cliente | Região/build e hashes registrados; extração não altera originais |
| Dois mapas | Ambos renderizam assets utilizáveis e marcadores próprios; nenhum usa placeholders como versão final |
| Calibração | >=3 âncoras de ajuste e >=2 independentes por região; erro <=2 unidades nas de conferência |
| Pontos | >=10 pontos de cada mapa conferidos em jogo, incluindo altitude/acesso quando aplicáveis; cobertura parcial explicitada |
| Dados reais | Nenhuma fixture synthetic no release público; referências e condições de uso aprovadas |
| Progresso | Recarregar, trocar personagem, trocar mapa e exportar/importar preservam estados; reset tem escopo e confirmação |
| Calendário | Diário usa reset documentado ou permanece manual, sem simular certeza |
| Simulador | Ao menos um baú real com taxas e modelo verificáveis, ou beta explicitamente hipotético sem alegar MVP real completo |
| Motor | Vetores determinísticos, limites, grupos garantidos/exclusivos/independentes e cálculos de referência passam |
| Comunidade | Proposta não publica sozinha; autoaprovação bloqueada; release e rollback auditados |
| Privacidade | Testes de autorização entre contas e exclusão/exportação; sem dados privados em cache público |
| Acesso | Fluxos centrais sem login; teclado e largura 360px utilizáveis |
| Recuperação | Restauração do banco e dos assets comprovada em homologação |

## Verificações funcionais

- Abrir link de ponto em ambos os mapas; copiar coordenada com/sem altitude; filtros combinados e busca global.
- Falha de rede não pode aparentar mapa vazio completo; cache serve somente revisões coerentes.
- Múltiplos pontos com mesmas coordenadas e alturas diferentes; transformação inversa singular rejeitada.
- Personagens A/B e contas A/B isolados; logout não deixa dados remotos privados visíveis a outro usuário; remoção de conta revoga sessão.
- Importação malformada não modifica dados; UUIDs forjados não concedem acesso; lote idempotente não duplica estados.
- Sincronização offline, conflito e retomada; limpeza do navegador comunicada como risco de perda sem backup.
- Resultados do motor idênticos em navegadores suportados para mesma entrada; estatísticas conhecidas verificadas analiticamente.
- Testar xss em dicas/fontes/contribuições, path traversal em arquivos e limite de complexidade em tabelas.

## Metas de desempenho

Medir em homologação com perfil documentado: viewport móvel de 390x844, CPU reduzida 4x e conexão de 10 Mbps/100 ms. Meta LCP <=2,5 s para páginas de entrada; mapa e primeiro lote utilizáveis <=4 s no cenário de referência. Desktop de referência com navegador atual deve aplicar filtro em dataset de 5.000 pontos em <=200 ms p95. Não renderizar todos os popups/ícones DOM simultaneamente; usar canvas/cluster se necessário.

Simulação de 100.000 aberturas de um grupo simples: meta <=3 s no desktop de referência, UI responsiva e cancelamento em <=250 ms entre lotes. Tabelas maiores obedecem orçamento de operações, não essa duração fixa. API pública cacheada: p95 <=300 ms na região de hospedagem, excluindo transferência de assets. Relatório identifica equipamento, build, dados e amostra usada; metas são critérios futuros, não medições já realizadas.

## Compatibilidade e acessibilidade

Últimas duas versões estáveis de Chrome/Edge, Firefox e Safari no momento da implementação. Não exigir clipboard API sem fallback de seleção de texto. Verificar foco, contraste, nomes acessíveis, mensagens de erro e lista alternativa do mapa. Não usar apenas testes automatizados para declarar WCAG AA.

## Processo de verificação

Testes unitários para motor, transformação, validação e calendário; integração para imports/referências/transações/autorização; E2E para mapas/progresso/simulador/contribuição. Revisão humana de amostras BR e direitos de conteúdo. Executar CLI OpenSpec compatível para validar proposta antes da implementação; corrigir formato se a versão escolhida exigir ajuste sem alterar requisitos acordados.
