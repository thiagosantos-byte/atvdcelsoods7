# Energia Viva — Marketplace de Energia Social + Comunidade 3D | ODS 7

Aplicação web acadêmica que combina uma comunidade 3D interativa com um protótipo de Marketplace de Energia Social. A plataforma organiza cadastros demonstrativos, triagem social, cadastro de usinas e patrocinadores, compatibilidade entre unidades consumidoras e propostas de rateio de excedentes.

## O que está implementado

- Comunidade 3D construída com Three.js + React Three Fiber: casas selecionáveis, ruas, calçadas, escola, árvores, postes e instalações representadas fisicamente.
- Instalação e remoção de painéis fotovoltaicos, eficiência energética, créditos de solar compartilhada, luminárias solares, aquecedor solar, biodigestor e sistema off-grid com bateria.
- Três cenários prontos: infraestrutura precária, transição energética e soluções integradas.
- Calculadora por residência: renda, renda por pessoa, CadÚnico, BPC, equipamento médico, consumo, tarifa, tributos e cobranças fixas.
- Simulação educativa da Tarifa Social com base nas regras divulgadas pela ANEEL: gratuidade da parcela de energia dos primeiros 80 kWh para beneficiários desde 5 de julho de 2025, mantendo a possibilidade de cobranças como tributos e iluminação pública. A verificação não substitui a análise oficial da distribuidora.
- Indicadores e gráficos da comunidade, comparação antes/depois e ranking ponderado de soluções.
- Modo apresentação guiado, exportação de relatório JSON, modo claro/escuro, opção de reduzir animações e alternativa de seleção de residências fora da cena 3D.
- Salvamento automático local por `localStorage` e persistência remota opcional usando Supabase.
- Conteúdo institucional com links para ONU, IPEA, ANEEL, Planalto, INPI, Revolusolar e Litro de Luz Brasil.
- **Marketplace de Energia Social:** painel de famílias, cadastro e triagem por renda per capita (1 a 2 salários mínimos), benefício tarifário, comprometimento da conta (parâmetro proposto de 8%), unidade consumidora e adesão formal.
- Cadastro demonstrativo de usinas, distribuidoras, entidades de geração compartilhada e patrocinadores.
- Motor de compatibilidade que verifica a mesma distribuidora, participação formal e critérios sociais antes de sugerir rateio do excedente.
- Relatório JSON com famílias, usinas, patrocinadores e propostas de alocação; dados do Marketplace salvos localmente no navegador.

## Executar localmente

Requisitos: Node.js 20 ou superior e npm.

```bash
npm install
npm run dev
```

Abra o endereço exibido pelo Vite (normalmente `http://localhost:5173`).

Gerar build de produção:

```bash
npm run build
npm run preview
```

## Marketplace de Energia Social — uso do protótipo

No menu superior, abra **Marketplace**. As áreas disponíveis são: **Visão geral**, **Famílias**, **Usinas e parceiros** e **Compatibilidade e rateio**. Cadastre famílias com dados fictícios, registre usinas e patrocinadores e execute o cálculo para visualizar propostas. O aplicativo salva os cadastros do Marketplace no `localStorage` do navegador e permite exportar um relatório JSON.

**Importante:** os dados de exemplo são fictícios. O motor calcula apenas uma proposta acadêmica; não envia rateio à distribuidora, não cria créditos, não realiza compensação em faturas e não comprova economia real. A taxa de R$ 0,65/kWh é uma premissa ilustrativa do protótipo, não uma tarifa oficial. O piloto real depende de parecer jurídico, enquadramento da usina e da entidade no SCEE, confirmação da mesma distribuidora, adesão formal, procedimento oficial de alocação, LGPD, autenticação e backend seguro. Não use dados pessoais reais nesta versão local.

## Supabase (opcional)

A aplicação funciona sem conta Supabase. Nesse caso, as alterações são armazenadas no navegador atual.

Para ativar o histórico remoto:

1. Crie um projeto no Supabase.
2. Abra `supabase/schema.sql` no SQL Editor e execute o script.
3. Copie `.env.example` para `.env`.
4. Preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` com os dados do projeto.
5. Reinicie `npm run dev`.
6. Use Configurações → Sincronizar com Supabase.

**Atenção:** o SQL incluso libera acesso público de demonstração para select/insert, sem autenticação, para facilitar o teste. Não use essa política em produção nem armazene dados pessoais. Para produção, implemente login, `owner_id`, políticas RLS restritas a `auth.uid()` e regras de retenção/privacidade.

## Premissas e limites dos cálculos

Os valores iniciais de consumo, tarifa, impostos, custos de equipamentos, geração, economia e investimento são **dados demonstrativos**, não estatísticas oficiais ou orçamentos comerciais. Edite os parâmetros na calculadora para testar outras condições.

- Tarifa inicial: R$ 0,92/kWh (premissa de demonstração, ajustável).
- Parâmetro de renda per capita da Tarifa Social: meio salário mínimo de 2026 (R$ 810,50), considerando o salário mínimo nacional de R$ 1.621,00 a partir de 1º de janeiro de 2026.
- Fator de emissão: 0,08 kg CO₂/kWh (hipótese didática, não fator oficial do SIN).
- Energia solar, créditos compartilhados, armazenamento, biogás e economias são estimativas simplificadas.
- O biodigestor exibe biogás como energia térmica equivalente e não contabiliza esse valor como eletricidade.
- A simulação de geração distribuída não calcula todas as componentes de uso da rede, transições tarifárias ou regras individualizadas do SCEE da Lei nº 14.300/2022.
- A Tarifa Social é uma verificação didática de critérios básicos. A elegibilidade definitiva depende de CadÚnico atualizado, dados da unidade consumidora, titularidade e validação pelas regras e agentes competentes.
- O retorno financeiro é uma projeção simples baseada nos custos e economia parametrizados. Não inclui juros, financiamento, manutenção extraordinária, degradação, seguros ou variação tarifária.
- A classificação do ranking é uma matriz didática ajustável, não um parecer técnico, econômico ou jurídico.

## Referências institucionais

- ONU — ODS 7: https://sdgs.un.org/goals/goal7
- IPEA — ODS 7 no Brasil: https://www.ipea.gov.br/ods/ods7.html
- ANEEL — Tarifa Social: https://www.gov.br/aneel/pt-br/assuntos/tarifas/tarifa-social
- Senado Federal — Decreto nº 12.797/2025 (salário mínimo de 2026): https://legis.senado.gov.br/norma/41882097/publicacao/41888369
- Lei nº 14.300/2022: https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2022/lei/l14300.htm
- INPI — Patentes Verdes: https://www.gov.br/inpi/pt-br/uso-estrategico-da-pi/inpi-para-empreender-e-inovar/tramite-prioritario-para-patentes-verdes-o-que-e-e-como-solicitar
- Revolusolar: https://revolusolar.org.br/
- Litro de Luz Brasil: https://www.litrodeluz.com/

## Estrutura

```text
ods7-comunidade/
├── index.html
├── package.json
├── .env.example
├── README.md
├── supabase/
│   └── schema.sql
└── src/
    ├── App.jsx
    ├── main.jsx
    ├── styles.css
    ├── components/
    │   ├── CommunityScene.jsx
    │   └── Marketplace.jsx
    └── lib/
        ├── simulation.js
        └── supabase.js
```

## Iniciar no Windows

Também é possível iniciar sem digitar os comandos manualmente: dê duplo clique em `INICIAR-ENERGIA-VIVA.bat`. Na primeira execução, o arquivo instalará as dependências (é necessário ter Node.js LTS e conexão com a internet); nas próximas, inicia diretamente o Vite.

## Publicar na Vercel

O projeto está pronto para importação como aplicação Vite. Na Vercel, selecione a pasta que contém este `package.json` como Root Directory. Use `npm run build` como Build Command e `dist` como Output Directory. O arquivo `vercel.json` mantém o fallback da aplicação.
