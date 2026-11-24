# HiperXP — identidade visual 1.0

Identidade baseada na opção 01 aprovada: gema hexagonal vermelha e lettering arredondado inclinado. Arte digital gerada e exportada para uso web. Data: 23/11/2026.

Abra `guia/identidade-visual.html` para visualizar o manual completo. Não precisa de instalação; manter as pastas juntas. A prévia em `guia/preview.png` é uma visão resumida.

## Arquivos

- `logos/`: duas versões transparentes, Hiper branco para fundo escuro e Hiper carvão para fundo claro; PNG mestre e PNG/WebP em 1600, 800 e 400 px.
- `icones/`: gema separada em 512, 256, 128, 64, 48, 32 e 16 px.
- `favicon/`: ICO multirresolução, PNG 16/32/48, Apple Touch 180, Android 192/512 e máscara segura 512.
- `fontes/`: Exo 2 variável normal/itálica, Exo 2 ExtraBold Italic estática, Inter variável e licenças OFL.
- `web/`: tokens CSS com temas claro/escuro, paleta JSON, configuração TypeScript, manifesto e trecho de integração HTML.
- `social/`: capa 1200x630 e avatar 512x512.
- `guia/`: manual visual, regras de uso, prévia e integração.

## Fonte da logo versus fontes de apoio

O lettering HiperXP é arte personalizada gerada. Não existe arquivo TTF/OTF exato desse desenho neste kit. Use a imagem fornecida para manter a marca. Exo 2 ExtraBold Italic é uma fonte de apoio visualmente compatível para títulos; Inter é a fonte de interface. Não recriar a logo digitando com essas fontes e afirmar que é o desenho original.

## Formatos e resolução

Logos e gema são raster PNG/WebP. O kit não contém SVG vetorial, arquivo de curvas ou fonte própria inventada. Usar arquivos até seu tamanho nativo; para impressão grande ou vetores editáveis é necessário redesenho vetorial posterior. ICO é contêiner de imagens em tamanhos específicos. Variações clara/escura foram geradas e podem ter pequenas diferenças de renderização; não alternar as duas dentro do mesmo tema.

## Integração

Copie o conteúdo do kit para `public/brand/`. Use os exemplos de `web/head-snippet.html` e `web/brand-config.ts`. O manifesto usa caminhos /brand e deve ser ajustado se a pasta pública for diferente. Não há service worker ou aplicativo implementado por esse arquivo.

## Licenças

Exo 2 e Inter acompanham as respectivas SIL Open Font License; seus autores não estão endossando a marca. Arquivos baixados do repositório google/fonts, pastas ofl/exo2 e ofl/inter. Exo 2 ExtraBold Italic foi instanciada do arquivo variável incluído, sem alteração do desenho. A arte da marca foi gerada para este projeto, não extraída do jogo. Não foi verificada disponibilidade de marca/domínio.
