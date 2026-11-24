# Motor probabilístico

## Domínio inicial

“Drops” no MVP significa recompensas de abertura de baús e pacotes. Uma tabela de monstros somente entra depois de documentar as regras de quantidade de rolagens, penalidade por nível, modificadores do servidor, grupos, elegibilidade e eventos. Não equiparar peso de item a chance final de drop.

## Modelo mínimo

Cada abertura avalia uma lista ordenada de grupos; todos os grupos são executados. Cada grupo é de um dos tipos:

| Tipo | Semântica |
|---|---|
| guaranteed | Entrega cada bundle uma vez por abertura, sem consumir RNG |
| exclusive_weighted | Realiza `rolls` sorteios independentes com reposição; cada sorteio seleciona exatamente uma entrada por peso inteiro positivo |
| independent_bernoulli | Para cada entrada e cada um dos `rolls`, realiza teste independente com numerador inteiro entre zero e denominador |

Bundle é lista de `(item_id, quantity)` com quantidade inteira positiva. Entrada vazia `rewards: []` representa não receber nada; nunca criar vazio implícito. A ordem canônica é `group.order`, `group.id`, `entry.order`, `entry.id`. IDs não podem repetir no escopo definido pelo contrato.

Para probabilidades declaradas de um grupo exclusivo, `probability_denominator` é obrigatório e a soma dos pesos deve ser exatamente esse denominador. Para pesos relativos, denominador é a soma dos pesos e o tipo de evidência deve declarar que são pesos. Não confundir 1% com peso 1 entre 1.000. Importar decimais apenas quando conversíveis exatamente à unidade inteira escolhida; rejeitar arredondamento silencioso.

Para Bernoulli cada entrada tem seu denominador; a soma das probabilidades pode ultrapassar 100%, pois múltiplos itens podem sair juntos. Probabilidade zero é permitida em Bernoulli, mas peso zero é omitido/rejeitado no exclusivo. Entradas garantidas não possuem peso.

Tabelas com garantia após N aberturas, estado persistente, elegibilidade, escolha do jogador, sorteio sem reposição, quantidades aleatórias ou recursão para abrir automaticamente outro baú ficam `unsupported` no MVP. Receber um baú como item não significa abri-lo automaticamente. Não achatar grupos desconhecidos.

## Sorteio uniforme e limites

PRNG determinístico especificado no código e versionado, com vetores de referência publicados. Converter saída em inteiro uniforme `[0,D)` com rejection sampling, sem viés de módulo; fixar estratégia para denominadores maiores que uma palavra. Limitar denominadores/pesos acumulados a inteiros positivos <= 2^53-1 ou usar BigInt integralmente; não converter silenciosamente inteiros grandes em Number. Quantidades acumuladas usam BigInt/strings decimais na exportação quando necessário.

Distribuição exclusiva usa intervalos cumulativos semiabertos: escolher primeira entrada cujo acumulado seja maior que r. Para Bernoulli, sucesso quando r < numerador. Randomização não depende de renderizações da UI ou velocidade da máquina. Worker pode pausar em lotes sem alterar sequência.

Máximo inicial: 100.000 aberturas e 5.000.000 testes de RNG por execução, 100 detalhes de abertura e 10 MB de exportação. Validar orçamento antes de executar. Ajustar limites apenas após medição, sem alterar semântica. Quantidade de recompensas distintas também possui limite de importação (10.000 entradas totais e 100 grupos por tabela). Tabelas que ultrapassam orçamento mostram máximo viável.

## Métricas

Para um item presente em uma única entrada exclusiva com peso w, total W, quantidade fixa q e k rolagens independentes por abertura:

- Probabilidade por rolagem: p=w/W.
- Probabilidade de ao menos uma ocorrência na abertura: 1-(1-p)^k.
- Quantidade esperada em N aberturas: N*k*p*q.
- Probabilidade de pelo menos uma ocorrência em N aberturas: 1-(1-p)^(k*N).

Se o mesmo item aparece em vários resultados, agregar primeiro suas probabilidades dentro de cada grupo exclusivo (bundles com o item contam como uma ocorrência). Entre grupos comprovadamente independentes, multiplicar probabilidades de ausência: P(ao menos um)=1-produto(P(ausência no grupo)). Somar expectativas de quantidades por linearidade. Se existe recompensa garantida desse item, P(ao menos um)=1 para N>=1. Para N=0, quantidade e probabilidade são zero.

Não usar fórmulas de independência para modelos com memória/correlação desconhecida. Para alvos compostos como “obter os três itens diferentes”, omitir cálculo exato no MVP, em vez de reutilizar a fórmula de um item. Mediana/percentis de tentativas só quando distribuição for demonstrada; não fazer parte obrigatória do MVP.

Na UI distinguir: quantidade de itens, número de aberturas contendo o item, frequência observada por abertura e probabilidade teórica por abertura. Quantidade de item dividida por aberturas não é necessariamente probabilidade.

## Custos opcionais

Entradas monetárias decimais com escala explícita; não usar float binário para valores. Custo total=N*custo por abertura. Valor estimado é soma de quantidade*preço informado por item. Se faltar cotação, marcar avaliação parcial e mostrar itens sem preço. Não comparar moedas diferentes nem converter GOLD sem taxa e fonte explícitas. Não prometer retorno; mostrar “simulação sem efeito no jogo”. Nenhum pagamento de abertura no site.

## Testes de referência

- Grupo exclusivo com pesos 1 e 3, uma rolagem, q=1: p do primeiro=0,25; expectativa em 100=25; probabilidade em 2=0,4375.
- Chance p=0,01, N=100: P>=1 = 0,6339676587267709 aproximadamente.
- Dois Bernoulli independentes de 0,5 para itens diferentes: ambos podem sair; probabilidade dos dois=0,25.
- Item A garantido junto a grupo exclusivo: A sempre aparece, sem deslocar a sequência RNG por consumir sorteio extra.
- Distribuição exclusiva declarada com total 9 e denominador 10: rejeitar, não escalar.
- Mesmo item em duas entradas do mesmo grupo: somar chances, sem tratar como eventos independentes.
- Mesmo seed/snapshot em Chrome e Firefox: mesma sequência e contagens.
- Cancelar após n aberturas completas: resultado coincide com prefixo n da execução integral.

Fixtures são artificiais. Testes estatísticos servem para detectar erros grosseiros e não validam a verdade das taxas do jogo; evitar testes aleatórios frágeis em CI. Priorizar vetores determinísticos, limites, invariantes e cálculo analítico conhecido.
