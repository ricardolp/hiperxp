## ADDED Requirements

### Requirement: Uso aberto

O sistema SHALL permitir consultar mapas, fontes e simulador e salvar progresso local sem cadastro nem pagamento.

#### Scenario: Visitante
- **WHEN** uma pessoa abre o site sem sessão
- **THEN** acessa as funções centrais sem bloqueio de login.

### Requirement: Acessibilidade e responsividade

O sistema SHALL atender WCAG 2.2 AA como meta de aceitação, com lista equivalente ao mapa e suporte a teclado.

#### Scenario: Celular
- **WHEN** a largura útil é 360px
- **THEN** filtros e detalhes são utilizáveis sem depender de hover e sem rolagem horizontal da página.

#### Scenario: Teclado
- **WHEN** um usuário navega sem mouse
- **THEN** pode localizar ponto na lista, abrir detalhes, copiar coordenadas e registrar conclusão.

### Requirement: Proteção de dados

O sistema SHALL aplicar autorização por objeto, limites, saneamento de conteúdo e exportação/exclusão de dados pessoais.

#### Scenario: Conteúdo malicioso
- **WHEN** uma contribuição contém HTML e script
- **THEN** nada é executado e a visualização sanitizada preserva texto seguro.

#### Scenario: Exclusão de conta
- **WHEN** o titular confirma exclusão
- **THEN** progresso e identificadores pessoais são removidos ou anonimizados conforme política publicada, sem expor dados em auditoria pública.

### Requirement: Operação e disponibilidade

O sistema SHALL manter releases independentes de sites externos, monitoramento e backups restauráveis.

#### Scenario: Fonte fora do ar
- **WHEN** PW Map não responde
- **THEN** o release publicado continua disponível.

#### Scenario: Restauração
- **WHEN** um backup é restaurado em homologação
- **THEN** integridade das referências e disponibilidade dos assets são conferidas antes de declarar recuperação.
