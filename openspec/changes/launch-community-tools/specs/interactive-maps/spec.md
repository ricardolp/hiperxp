## ADDED Requirements

### Requirement: Dois mapas independentes

O sistema SHALL oferecer Cidade da Paz e Tianyu com assets, limites, revisão, pontos e transformação próprios.

#### Scenario: Alternar região
- **WHEN** um visitante alterna entre os mapas
- **THEN** a região escolhida é carregada sem reutilizar coordenadas, filtros incompatíveis ou progresso da outra região.

#### Scenario: Falha de dados
- **WHEN** os pontos de Tianyu não podem ser carregados
- **THEN** a interface informa a falha e permite tentar novamente; não apresenta ausência de pontos como mapa completo.

### Requirement: Coordenadas e localização

O sistema SHALL usar coordenadas planas calibradas e preservar altitude e instância quando disponíveis.

#### Scenario: Calibração independente
- **WHEN** uma revisão de mapa é preparada
- **THEN** três âncoras não colineares e duas de conferência por mapa são registradas, com erro máximo de duas unidades do jogo nas de conferência.

#### Scenario: Copiar ponto
- **WHEN** a pessoa copia um ponto com altitude
- **THEN** o texto preserva x, y e altitude no formato documentado para o cliente; altitude desconhecida não vira zero.

### Requirement: Busca e camadas

O sistema SHALL filtrar por tipo, estado e região interna, com busca por nomes, aliases e coordenadas.

#### Scenario: Busca sem acentos
- **WHEN** o nome tem acento e a consulta não
- **THEN** o ponto é encontrado sem modificar seu nome de exibição.

#### Scenario: Altitudes distintas
- **WHEN** dois pontos possuem x/y iguais e altitudes diferentes
- **THEN** ambos continuam selecionáveis na lista e nos detalhes.

### Requirement: Compartilhamento e acesso

O sistema SHALL permitir link direto e lista acessível de pontos, com condições de acesso e origem.

#### Scenario: Link público
- **WHEN** um link identifica mapa e ponto
- **THEN** o ponto é selecionado e os detalhes abrem sem expor progresso privado.

#### Scenario: Ponto inacessível
- **WHEN** há pré-requisito de missão conhecido
- **THEN** os detalhes informam o requisito e a fonte; não oferecem uma linha reta como rota caminhável.

### Requirement: Cobertura honesta

O sistema SHALL informar release, build-alvo e cobertura parcial ou revisada por mapa e categoria.

#### Scenario: Base incompleta
- **WHEN** o site possui 30 pontos e não conhece o total do jogo
- **THEN** o contador descreve 30 cadastrados e não afirma cobertura total.
