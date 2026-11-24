# Produto

## Proposta

Uma ferramenta comunitária de consulta e planejamento, acessível sem assinatura. A pessoa abre um mapa, encontra pontos próximos, copia coordenadas e registra o que já concluiu. No simulador, escolhe um baú, consulta a procedência das taxas e testa aberturas sem consumir itens do jogo.

Não existe integração de login com a conta do jogo, leitura de memória, automação de personagem ou compra de aberturas. A simulação é isolada do jogo.

## MVP obrigatório

### Mapas: Cidade da Paz e Tianyu

- Rotas `/mapas/cidade-da-paz` e `/mapas/tianyu`, com seletor entre ambas.
- Imagem/tiles de cada região, pan, zoom, limites de navegação e camadas.
- Pontos categorizados: baú, desafio, coletável/relíquia, recurso diário, NPC, teleporte e objetivo de missão. Publicar somente categorias que tenham dados para a região.
- Busca por nome BR, aliases RU/EN, ID e coordenadas; ignorar caixa e acentos na busca textual.
- Filtros de categoria, região interna, estado de conclusão e qualidade da informação.
- Painel do ponto com nome, tipo, coordenadas, altitude quando conhecida, condição de acesso, pré-requisitos, dica, evidência, versão e botão de correção.
- Ações explícitas: copiar coordenada, concluir/desfazer, compartilhar link. Não depender de duplo clique, hover ou cor para ações essenciais.
- Lista acessível equivalente aos marcadores; seleção entre lista e mapa sincronizada.
- Vários personagens locais, favoritos, exportação/importação de progresso, contador por categoria e mapa.
- Distinguir conclusão permanente de coleta diária; virada diária dependente do calendário documentado do servidor, nunca presumida pela meia-noite do navegador.
- Modo celular com painel inferior; desktop com filtros à esquerda e detalhes à direita.
- Mostrar cobertura como parcial até existir inventário revisado; quantidade de pontos no site não equivale automaticamente ao total do jogo.

### Simulador de drops

- Rotas `/drops` e `/drops/:slug` com busca de baús, versão, origem das taxas e lista de recompensas.
- Presets de 1, 10, 100 e 1.000 aberturas; entrada manual até 100.000, sujeita a teto de operações e tamanho de resultado.
- Motor executado em Web Worker, cancelamento e apresentação de progresso em simulações longas.
- Resultados agregados por item: quantidade, frequência de aberturas com o item e percentual observado. Expandir últimas aberturas com limite de 100 registros.
- Exibir expectativa teórica, chance de pelo menos uma ocorrência e comparação com a amostra somente quando suportadas pelo modelo de sorteio.
- Campo opcional de custo por abertura e valor por item, sempre informados pelo usuário ou fonte datada; distinguir moedas e GOLD, sem conversão presumida.
- Resultados com seed, versão do motor e revisão da tabela, exportáveis em JSON/CSV.
- Probabilidades desconhecidas não serão preenchidas com pesos iguais. Cenários personalizados ficam separados e identificados como hipótese.
- O MVP deve suportar sorteio exclusivo ponderado, itens garantidos e grupos independentes de Bernoulli; outros modelos são rejeitados até implementação validada.

### Comunidade e administração

- Visitante pode consultar, simular e manter progresso local.
- Conta opcional pode sincronizar progresso e enviar contribuições; visitante pode reportar erro com limite de frequência, sem anexos no MVP.
- Contribuições são propostas de alteração, acompanhadas de evidência; não mudam o dado público imediatamente.
- Revisores aprovam/rejeitam com justificativa e histórico; autor não aprova sua própria mudança.
- Administração importa lotes, revisa diffs, resolve duplicados e publica releases reversíveis.
- Página pública de fontes, colaboradores, changelog, limitações de cobertura e aviso de projeto de fãs independente.

## Navegação e linguagem visual

Início: duas entradas grandes para os mapas e uma para o simulador, seguidas por novidades dos dados. Cabeçalho com Mapas, Missões (guias), Database (enciclopédia do cliente), Simulador. Tema escuro inicial e claro opcional; interface limpa, tipografia legível, categorias com ícone e texto, sem exigir imagens do jogo para funcionar. Identidade visual própria; não replicar a marca de terceiros.

Mostrar mensagens claras: “Dados ainda não disponíveis”, “Coordenada em revisão”, “Taxas não confirmadas para esta versão”, “Progresso salvo neste navegador” e “Falha ao sincronizar; alterações mantidas localmente”. Nunca simular sucesso de persistência.

## Fora do MVP

Mercado em tempo real, calculadora completa de personagem, fórum, aplicativo nativo, rankings competitivos, traçado automático de caminho caminhável, todos os mapas do PW e estimativas de drop de monstros sem fórmula verificada. Rota geométrica entre pontos pode ser estudada depois; não deve ser apresentada como caminho transitável.

## Entregas e gates

1. Investigação: build BR identificado, inventário seguro e amostras de coordenadas e baú.
2. Fundação: esquema de dados, importador, validações, autenticação opcional e conteúdo sintético isolado.
3. Mapas: duas regiões calibradas, marcadores revisados, progresso local e lista acessível.
4. Drops: motor validado, tabela revisada, simulação e exportação reproduzíveis.
5. Comunidade: revisão, releases e sincronização opcionais operacionais.
6. Lançamento público: ambos os mapas utilizáveis com cobertura declarada e ao menos um baú real com modelo verificável. Se só houver cenários hipotéticos, publicar beta identificado, sem afirmar conclusão do simulador real.

Sem prazo fechado antes da investigação dos arquivos. Nome, domínio e provedores de hospedagem/autenticação são decisões posteriores; a implementação deve funcionar localmente com Docker Compose e armazenamento compatível com S3 em ambiente de desenvolvimento.
