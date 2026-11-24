## ADDED Requirements

### Requirement: Procedência das taxas

O sistema SHALL exibir revisão, região/build, modelo e qualidade da evidência de cada tabela.

#### Scenario: Taxa ausente
- **WHEN** não há probabilidade conhecida de uma recompensa
- **THEN** não se atribui chance uniforme e o modo real fica indisponível.

#### Scenario: Hipótese personalizada
- **WHEN** o visitante informa pesos próprios
- **THEN** o resultado fica marcado como cenário hipotético e não altera a base pública.

### Requirement: Sorteios corretos

O sistema SHALL implementar grupos exclusivos ponderados, garantidos e Bernoulli independentes conforme docs/drop-engine.md.

#### Scenario: Um item exclusivo
- **WHEN** um grupo exclusivo é sorteado
- **THEN** exatamente uma entrada é escolhida, incluindo vazio quando explicitamente configurado.

#### Scenario: Total inconsistente
- **WHEN** uma distribuição declarada em probabilidades não soma o denominador
- **THEN** a tabela é rejeitada sem normalização silenciosa.

#### Scenario: Modelo não suportado
- **WHEN** a tabela exige pity ou sorteio sem reposição não implementado
- **THEN** o modo real é bloqueado em vez de usar fórmula aproximada.

### Requirement: Reprodutibilidade

O sistema SHALL reproduzir resultados quando seed, revisões, ordem e parâmetros forem idênticos.

#### Scenario: Mesmo experimento
- **WHEN** duas execuções usam o mesmo snapshot e seed
- **THEN** contagens e sequência de resultados coincidem.

#### Scenario: Mudança de revisão
- **WHEN** a base ativa muda depois da execução
- **THEN** exportação identifica a revisão original e sua reprodução usa esse snapshot.

### Requirement: Estatística e custos

O sistema SHALL distinguir frequência observada, chance por abertura, quantidade esperada e custo informado.

#### Scenario: Chance acumulada
- **WHEN** um item tem probabilidade 0,01 em aberturas independentes
- **THEN** a chance de pelo menos um em 100 é 1-(0,99)^100, e não 100%.

#### Scenario: Valor ausente
- **WHEN** parte dos itens não tem preço
- **THEN** o resultado identifica avaliação incompleta e não trata os itens sem preço como cotação zero.

### Requirement: Limites e cancelamento

O sistema SHALL executar o motor fora da thread principal e limitar trabalho por operações e tamanho.

#### Scenario: Carga máxima
- **WHEN** o usuário solicita 100.000 aberturas de uma tabela simples
- **THEN** a UI permanece utilizável, há progresso e o resultado é agregado.

#### Scenario: Cancelamento
- **WHEN** a execução é cancelada
- **THEN** o resultado parcial informa quantidade efetivamente processada e não afirma ter concluído o pedido.
