# HiperXP — arquivos da marca

## Conteúdo
- logos/: logo completa em PNG transparente, original e larguras 240, 480 e 960 px.
- wordmark/: nome separado, sem o cristal.
- icones/: cristal colorido e branco, recortado e em telas quadradas de 16 a 1024 px.
- favicon/: ICO com múltiplas resoluções, PNG 16/32/48, Apple Touch Icon 180 e Android 192/512.
- site.webmanifest: exemplo para instalação como aplicativo.

## Cores e usos
- colorida: cristal vermelho, Hiper claro e XP vermelho, para fundo escuro.
- branca: marca monocromática branca, para fundos escuros ou coloridos.
- vermelho-branco: cristal vermelho e nome inteiramente branco.
- fundo-claro: cristal vermelho e nome escuro.

As imagens PNG têm fundo transparente. Os ícones Apple/Android têm fundo escuro. A versão branca deve ser visualizada sobre fundo escuro. O X do cristal branco usa transparência para manter sua leitura.

## Aplicação no site
Use a logo completa com 120 a 150 px de largura e height:auto. Escolha o PNG com pelo menos o dobro da largura de exibição. Para favicon, copie os arquivos de favicon/colorida para o caminho público correspondente. Ajuste os caminhos do manifesto à estrutura do site.

```html
<link rel="icon" href="/favicon/colorida/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon/colorida/favicon-32x32.png">
<link rel="apple-touch-icon" href="/favicon/colorida/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<img src="/logos/hiperxp-vermelho-branco-480w.png" width="140" alt="HiperXP" style="height:auto">
```

Formatos raster PNG/ICO. Este pacote não contém uma fonte tipográfica ou um arquivo vetorial editável: o lettering é parte da arte aprovada.
