## 1. Dados e investigação

- [ ] 1.1 Identificar região/build do cliente e registrar manifesto sem dados pessoais.
- [ ] 1.2 Verificar formatos e licença dos parsers candidatos; escolher adaptador compatível.
- [ ] 1.3 Localizar imagens dos dois mapas e definir condição de reutilização ou assets próprios.
- [ ] 1.4 Verificar fonte dos pontos de Pokoi/Tianyu e correspondência com cliente BR.
- [ ] 1.5 Definir glossário e nomes BR; revisar amostra de dez pontos por mapa.
- [ ] 1.6 Identificar primeiro baú real e evidência de taxas/semântica; manter desconhecidos explícitos.

## 2. Fundação

- [ ] 2.1 Inicializar monorepo Go/React/TypeScript e lockfiles com versões estáveis compatíveis.
- [ ] 2.2 Definir JSON Schema e OpenAPI; validar fixtures e separar dados sintéticos.
- [ ] 2.3 Criar migrações PostgreSQL, armazenamento de assets e releases.
- [ ] 2.4 Configurar ambiente local reproduzível, CI e verificações de lint/tipos/build.

## 3. Importador

- [ ] 3.1 Implementar inventário/extratores somente leitura com hashes e limites.
- [ ] 3.2 Implementar staging, validação, idempotência e diff revisável.
- [ ] 3.3 Implementar proveniência, aliases, referências e rejeição de modelo desconhecido.
- [ ] 3.4 Testar parser com amostra real e dados inválidos sem modificar originais.

## 4. Mapas

- [ ] 4.1 Implementar renderer Leaflet com coordenadas planas e dois mapas independentes.
- [ ] 4.2 Calibrar cada região e registrar âncoras independentes e erro medido.
- [ ] 4.3 Implementar busca global, filtros, lista, detalhes, compartilhamento e cópia.
- [ ] 4.4 Implementar layout móvel, teclado e estados de carregamento/falha/cobertura.
- [ ] 4.5 Testar altitudes coincidentes, pré-requisitos e consistência entre releases.

## 5. Progresso

- [ ] 5.1 Implementar personagens e estados em IndexedDB com migração versionada.
- [ ] 5.2 Implementar exportação/importação, reset e preservação de pontos removidos.
- [ ] 5.3 Implementar calendário diário quando verificado; fallback manual.
- [ ] 5.4 Implementar conta opcional, sincronização idempotente e conflitos explícitos.
- [ ] 5.5 Testar isolamento entre personagens/contas, falha local e retomada offline.

## 6. Simulador

- [ ] 6.1 Implementar modelo e validador de grupos, pesos e bundles.
- [ ] 6.2 Implementar RNG determinístico versionado e vetores conhecidos.
- [ ] 6.3 Implementar Worker, orçamento, cancelamento e agregação de resultados.
- [ ] 6.4 Implementar catálogo, detalhe, presets, custos opcionais e exportação.
- [ ] 6.5 Implementar expectativas/chances somente para modelos demonstrados.
- [ ] 6.6 Verificar testes de referência, reprodução entre navegadores e primeiro baú real.

## 7. Comunidade e operação

- [ ] 7.1 Implementar reports e propostas com evidências e limites de frequência.
- [ ] 7.2 Implementar revisão, prevenção de autoaprovação e conflito de release-base.
- [ ] 7.3 Implementar publicação atômica, changelog e rollback.
- [ ] 7.4 Implementar autorização por objeto, saneamento, limites e exclusão/exportação pessoal.
- [ ] 7.5 Definir licença do código novo, políticas de dados/assets e atribuições públicas.
- [ ] 7.6 Configurar logs/métricas/backups e comprovar restauração.

## 8. Aceitação

- [ ] 8.1 Validar proposta com CLI OpenSpec compatível e registrar versão.
- [ ] 8.2 Executar aceitação de mapas/progresso/drops/moderação e revisar evidências BR.
- [ ] 8.3 Medir desempenho e revisar acessibilidade manualmente.
- [ ] 8.4 Publicar release beta com cobertura e limitações explícitas.
- [ ] 8.5 Arquivar mudança e sincronizar specs vigentes somente após implementação aceita.
