## ADDED Requirements

### Requirement: Propostas comunitárias

O sistema SHALL aceitar sugestões com tipo, valores propostos, release-base e evidência, sem editar diretamente a base pública.

#### Scenario: Nova localização
- **WHEN** um colaborador propõe um baú
- **THEN** a proposta entra em revisão e não aparece como ponto validado.

#### Scenario: Report anônimo
- **WHEN** um visitante reporta uma coordenada incorreta
- **THEN** o relato recebe protocolo sem revelar dados de outros relatos e passa por limite de frequência.

### Requirement: Revisão auditável

O sistema SHALL separar permissões de colaborador, revisor e administrador e impedir autoaprovação.

#### Scenario: Autoaprovação
- **WHEN** o autor tenta aprovar a própria contribuição
- **THEN** a operação é rejeitada inclusive pela API.

#### Scenario: Proposta obsoleta
- **WHEN** o ponto mudou desde o release-base
- **THEN** o revisor vê conflito e deve atualizar a proposta antes de aprovar.

### Requirement: Releases e rollback

O sistema SHALL publicar snapshots imutáveis de dados e trocar o release ativo atomicamente.

#### Scenario: Falha de publicação
- **WHEN** um asset obrigatório não está disponível
- **THEN** o release anterior continua ativo.

#### Scenario: Rollback
- **WHEN** o administrador retorna ao release anterior
- **THEN** a base pública muda de ponteiro sem apagar progresso, contribuições ou auditoria.
