# Aplicação à especificação do site

Nome de produto: HiperXP. Mantém o escopo de Cidade da Paz, Tianyu e simulador de drops definido na OpenSpec original.

- Substituir o nome provisório PW Comunidade por HiperXP nos títulos públicos.
- Cabeçalho escuro: `hiperxp-escuro-800.webp`; tema claro: `hiperxp-claro-800.webp`.
- Largura inicial da logo: 160 a 200 px no desktop; no celular reduzir até 128 px, abaixo disso usar só gema.
- Avatar, menu recolhido e carregamento: gema isolada, sem texto minúsculo.
- Botões primários usam tokens semânticos, não cores amostradas das facetas da gema.
- Cores dos pontos do mapa são independentes da marca e precisam de ícones/rótulos próprios. Vermelho não identifica ao mesmo tempo seleção, erro e todos os tipos de ponto.
- Erros com ícone/texto; sucesso verde, pendências douradas, informação azul. O vermelho da marca não representa raridade de drop sem legenda.
- Aplicar manifesto e favicon; deixar visível o aviso de projeto comunitário independente.
- Validar contraste e foco nas telas finais. Pares de referência verificados em `contraste.json` não certificam toda a interface.

Este documento orienta a implementação, sem alterar nem afirmar que o ZIP da OpenSpec anterior foi atualizado.
