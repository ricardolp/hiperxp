## ADDED Requirements

### Requirement: Personagens locais

O sistema SHALL salvar progresso em IndexedDB separado por personagem, mapa e ponto estável, sem exigir login.

#### Scenario: Isolamento
- **WHEN** o personagem A conclui um baú
- **THEN** o personagem B permanece pendente e recarregar preserva o estado de A.

#### Scenario: Falha local
- **WHEN** o navegador bloqueia armazenamento
- **THEN** o site informa que não foi salvo e oferece exportação quando possível.

### Requirement: Coletas diárias

O sistema SHALL distinguir marcos permanentes e diários por período documentado do servidor.

#### Scenario: Virada diária
- **WHEN** um período válido termina
- **THEN** apenas conclusões diárias do período deixam de contar para o atual; histórico e permanentes são preservados.

#### Scenario: Calendário desconhecido
- **WHEN** não há regra de reset verificada
- **THEN** o site não reinicia automaticamente e oferece reset manual identificado.

### Requirement: Exportação e migração

O sistema SHALL importar/exportar progresso versionado e preservar referências entre releases.

#### Scenario: Backup e restauração
- **WHEN** um JSON válido é importado em navegador vazio
- **THEN** personagens e estados são restaurados com resumo de pontos órfãos.

#### Scenario: Arquivo inválido
- **WHEN** um arquivo excede limites ou falha no esquema
- **THEN** a operação falha sem alterar o progresso existente.

### Requirement: Sincronização opcional

O sistema SHALL exigir autenticação para nuvem, autorização por objeto e resolução explícita de conflitos.

#### Scenario: Conflito
- **WHEN** dois dispositivos enviam revisões conflitantes
- **THEN** a API devolve conflito e a UI mantém alterações locais até decisão.

#### Scenario: Conta diferente
- **WHEN** a pessoa faz login com progresso local existente
- **THEN** escolhe o que importar antes de associar dados à conta.

#### Scenario: Acesso indevido
- **WHEN** uma conta tenta ler personagem de outra
- **THEN** a API não retorna conteúdo privado.
