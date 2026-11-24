## ADDED Requirements

### Requirement: Extração local

O extrator SHALL ler cópias do cliente em modo somente leitura e produzir manifesto e saída normalizada.

#### Scenario: Versão desconhecida
- **WHEN** não existe parser verificado para o build
- **THEN** a ferramenta para com diagnóstico e não gera dados adivinhados.

#### Scenario: Integridade
- **WHEN** a extração termina
- **THEN** hashes originais permanecem iguais e nenhum arquivo de credencial/log pessoal entra no pacote.

### Requirement: Importação revisada

O sistema SHALL importar em staging e validar esquema, referências, precisão e versão antes de publicação.

#### Scenario: Reimportar lote
- **WHEN** o mesmo hash e versão de parser são reenviados
- **THEN** o lote é identificado sem duplicar entidades.

#### Scenario: Dados estrangeiros
- **WHEN** uma coordenada RU corresponde a entidade BR por hipótese
- **THEN** o mapeamento fica pendente até evidência; IDs iguais isoladamente não confirmam correspondência.

### Requirement: Proveniência por registro

O sistema SHALL manter fonte, data, hash quando aplicável, condição de reutilização e status de revisão.

#### Scenario: Fonte substituída
- **WHEN** um valor muda após revisão
- **THEN** o histórico preserva valor anterior, evidência e autor da aprovação.

#### Scenario: Asset sem autorização definida
- **WHEN** uma imagem tem condição de reutilização pendente
- **THEN** a publicação do asset fica bloqueada e a página usa alternativa própria.
