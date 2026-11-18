# Energia Viva — Território 3D imersivo

Esta versão amplia a maquete do território para uma cena 3D navegável, mantendo o simulador, o Marketplace, os indicadores e a integração opcional com Supabase já existentes no Energia Viva.

## O que foi ampliado

- 49 moradias em blocos urbanos, com alturas, fachadas, lajes, caixas-d'água e detalhes variados.
- As seis residências da simulação continuam vinculadas às seis famílias e às intervenções selecionadas no painel.
- Ruas principais e secundárias conectadas, calçadas, caminhos internos, becos e escadarias em terreno inclinado.
- Padaria, mercadinho, barbearia, loja comunitária, escola, unidade de saúde, quadra esportiva, praça e ponto de energia comunitária.
- Postes, transformadores, fiação aérea, luminárias, painéis solares, carros e personagens.
- Pontos clicáveis com informações relacionadas ao ODS 7.
- Modos de visão aérea, primeira pessoa e terceira pessoa, alternância dia/noite e camada ODS 7.
- Controles por teclado e mouse; o modo de terceira pessoa também oferece botões de toque.

## Como executar

Na pasta do projeto:

```bash
npm install
npm run dev
```

Abra no navegador o endereço local informado pelo Vite. As dependências de Three.js, React Three Fiber e Drei já constam no `package.json` do projeto original; não foi necessário adicionar dependências.

## Controles

**Visão do bairro:** arraste com o mouse ou dedo para girar a câmera; use a roda ou gesto de pinça para aproximar/afastar.

**Primeira pessoa:** selecione `1ª pessoa` e clique dentro da cena para capturar o mouse. Use `W A S D` ou as setas para caminhar, `SHIFT` para correr e o mouse para olhar. `ESC` libera o mouse. Em telas sensíveis ao toque, use os botões na tela.

**Terceira pessoa:** selecione `3ª pessoa`. Use `W A S D` para andar, `Q/E` para girar, `SHIFT` para correr ou o direcional na tela.

**ODS 7:** ative ou desative os marcadores dourados. Clique em um marcador, residência, comércio ou equipamento público para abrir informações.

**Dia/noite:** altera a iluminação do ambiente e evidencia a iluminação pública instalada no cenário.

## Arquivos principais

- `src/components/CommunityScene.jsx` — interface da cena 3D e seleção de modos de câmera.
- `src/components/neighborhood/NeighborhoodWorld.jsx` — montagem do bairro, terreno, ruas e pontos comunitários.
- `src/components/neighborhood/BuildingBlocks.jsx` — peças 3D modulares das casas, comércios, equipamentos e personagens.
- `src/components/neighborhood/PlayerController.jsx` — movimentação em primeira e terceira pessoa.
- `src/components/neighborhood/OdsOverlay.jsx` — marcadores interativos do ODS 7.
- `src/components/neighborhood/terrain.js` — relevo, lotes, distribuição das construções e colisões básicas.
- `src/data/odsData.js` — conteúdo dos pontos informativos do ODS 7.
- `src/styles.css` — controles e painéis sobrepostos à cena.

## Configuração local

O arquivo `.env` local não é incluído neste pacote para não expor chaves. Preserve o `.env` da sua cópia atual, caso já tenha configurado o Supabase. Sem as variáveis do Supabase, a aplicação continua funcionando com persistência local no navegador, como no projeto original.

## Observação técnica

O bairro é construído proceduralmente com geometrias 3D no próprio navegador. Não é uma imagem de fundo nem um modelo único de maquete. As seis casas ligadas à simulação são interativas; as demais moradias e espaços são elementos demonstrativos do ambiente. Valores de consumo, economia e impacto permanecem sendo os dados estimados pelo simulador existente.
