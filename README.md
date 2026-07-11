# ViajaReal

ViajaReal é uma aplicação de planejamento de viagens inspirada em experiências reais de viajantes. A versão atual funciona como uma SPA em React com dados mockados, interface responsiva, navegação entre telas e simulações de roteiro, custos, mapa, relatos e assistente de viagem.

O projeto está preparado para evoluir para integrações reais com IA, APIs externas, autenticação e persistência, mas nesta etapa o foco é demonstrar a experiência completa no frontend.

## Descrição do problema e solução proposta

O problema trabalhado é a dificuldade de planejar uma viagem com base em informações confiáveis e organizadas. Normalmente, o viajante precisa consultar relatos soltos, estimar custos manualmente, pesquisar mapas em outra ferramenta e montar o roteiro em planilhas ou anotações separadas.

A solução proposta pelo ViajaReal é centralizar essa experiência em uma plataforma única, com:

- descoberta de destinos;
- visualização de detalhes do destino;
- planejamento de roteiro por dias;
- linha do tempo de atividades;
- mapa de lugares;
- controle de custos;
- relatos da comunidade;
- assistente de viagem mockado;
- resultado de roteiro personalizado;
- perfil/configurações do usuário.

Nesta versão intermediária, todos os dados são simulados. A intenção é validar a experiência de produto, a navegação e os fluxos principais antes de conectar fontes reais.

## Como a IA será integrada futuramente

A IA ainda não está integrada de forma real. O projeto possui um `aiService.js` com `MOCK_MODE = true`, usado para simular geração de roteiro e recomendações.

Futuramente, a IA poderá ser usada para:

- gerar roteiros personalizados com base em destino, orçamento, quantidade de dias e estilo de viagem;
- resumir relatos de outros viajantes;
- estimar custos com base em histórico real;
- recomendar lugares próximos no mapa;
- identificar alertas de segurança, melhor época de viagem e pontos de atenção;
- transformar relatos longos em dicas práticas para o usuário.

O ponto de integração planejado é substituir as funções mockadas do `aiService.js` por chamadas a uma API real.

## Escolhas de design e arquitetura

### Arquitetura

A aplicação foi organizada como SPA em React porque o objetivo da etapa intermediária era entregar navegação fluida entre várias telas e permitir deploy simples na Vercel.

As principais escolhas foram:

- `React Router` para navegação entre telas reais, em vez de controlar tudo por estado em um único componente.
- `Tailwind CSS` para acelerar a construção visual e manter consistência de espaçamentos, cores e responsividade.
- `src/data` para concentrar todos os dados mockados fora dos componentes.
- `src/services` para simular uma camada de acesso a dados e facilitar futura substituição por API real.
- `src/components` para separar cards, layout, timeline e elementos do assistente.
- `vercel.json` com fallback para `index.html`, garantindo que rotas diretas do React funcionem no deploy.

### UI e experiência

O mockup original tinha forte aparência mobile. A primeira implementação ficou presa demais em uma largura de celular, o que prejudicou o uso no navegador desktop. Depois disso, a interface foi ajustada para:

- usar menu lateral no desktop;
- manter navegação inferior no mobile;
- ocupar melhor a largura da tela;
- organizar conteúdos em grids responsivos;
- manter cards brancos, fundo claro, sombra suave e roxo como cor principal.

Alternativas consideradas:

- manter uma interface 100% mobile, mas isso foi descartado por ficar pouco usual no deploy desktop;
- integrar backend FastAPI desde já, mas nesta etapa foi priorizado um frontend mockado completo para reduzir risco de falhas no deploy;
- usar mapa totalmente mockado em CSS, mas foi escolhido React Leaflet para aproximar a experiência de um mapa real.

## Estado atual do projeto

### Implementado

- Aplicação React + Vite com React Router.
- Interface responsiva para desktop e mobile.
- Menu lateral no desktop e navegação inferior no mobile.
- Dados mockados organizados em `frontend/src/data`.
- Services mockados organizados em `frontend/src/services`.
- Componentes reutilizáveis em `frontend/src/components`.
- Telas separadas em `frontend/src/pages`.
- Deploy configurado para Vercel como SPA frontend-only.
- Fallback de rotas no `vercel.json`, permitindo abrir URLs diretas como `/planner`, `/costs` e `/assistant/result`.

### Stack do frontend

- React
- Vite
- Tailwind CSS
- React Router
- Lucide React
- Recharts
- Leaflet / React Leaflet

## Telas implementadas

### 1. Dashboard

- Saudação personalizada.
- Campo de busca funcional para filtrar destinos mockados.
- Card da próxima viagem.
- Atalhos para Timeline, Mapa, Custos e Assistente.
- Lista de destinos populares.
- Relato recente da comunidade.

### 2. Página de Destino

- Banner grande do destino.
- Nome, país, avaliação e quantidade de relatos.
- Abas funcionais: Geral, Sobre, Clima, Custos, Dicas e Galeria.
- Cards de melhor época, custo médio, moeda, segurança, internet e idioma.
- Destaques como cultura, gastronomia, tecnologia e natureza.
- Botão para planejar viagem.
- Botão de salvar destino com estado visual.

### 3. Planejador de Roteiro

- Cabeçalho da viagem ativa.
- Seletor de dias.
- Abas funcionais: Roteiro, Mapa, Custos, Reservas e Dicas.
- Lista de paradas do dia.
- Botão de adicionar parada mockada.
- Botão de editar dia com feedback visual.

### 4. Timeline por Dia

- Linha do tempo vertical por horários.
- Cards com imagem, título, descrição e categoria.
- Botão de editar dia com feedback.
- Botão de adicionar parada mockada.

### 5. Mapa de Lugares

- Mapa com React Leaflet e marcadores mockados.
- Lista de lugares vinculada aos mesmos dados do mapa.
- Alternância funcional entre Mapa e Lista.
- Filtro mockado para exibir apenas pontos de gastronomia.

### 6. Controle de Custos

- Total previsto.
- Gasto por pessoa.
- Percentual do orçamento usado.
- Gráfico de rosca por categoria.
- Gráfico diário com Recharts.
- Botão de adicionar gasto mockado que atualiza valores e gráficos.

### 7. Relatos da Comunidade

- Lista de relatos sobre o destino.
- Avatar, autor, data, duração, tipo de viagem, custo, segurança e curtidas.
- Filtros funcionais: Mais recentes, Mais úteis, Custo e Segurança.
- Filtro de segurança alta.
- Botão para compartilhar relato mockado, adicionando um novo item à lista.

### 8. Assistente de Viagem Mockado

- Interface de chat.
- Perguntas guiadas para destino, dias, orçamento e estilo.
- Botões de estilo de viagem.
- Loading fake com mensagens de análise.
- Geração de roteiro por `aiService.js`.
- Não usa IA real nesta versão.

### 9. Resultado do Assistente

- Exibe roteiro mockado gerado.
- Resumo da viagem.
- Custo estimado.
- Segurança.
- Melhor época.
- Blocos de roteiro por dias/cidades.
- Botão de salvar roteiro em `localStorage`.
- Botão para editar roteiro voltando ao assistente.

### 10. Perfil / Configurações

- Banner e foto do usuário.
- Estatísticas de viagens, relatos, salvos e avaliação.
- Menu de configurações.
- Cada item do menu abre um painel mockado funcional.

## Estrutura principal do frontend

```text
frontend/src/
  components/
    assistant/
    cards/
    itinerary/
    layout/
  data/
    mockCommunityReports.js
    mockCosts.js
    mockDestinations.js
    mockPlaces.js
    mockTrips.js
    mockUser.js
  pages/
    AssistantResult.jsx
    CommunityReports.jsx
    CostsPage.jsx
    Dashboard.jsx
    DayTimeline.jsx
    DestinationPage.jsx
    PlacesMap.jsx
    ProfileSettings.jsx
    TravelAssistant.jsx
    TripPlanner.jsx
  services/
    aiService.js
    communityService.js
    costService.js
    destinationService.js
    tripService.js
  App.jsx
  main.jsx
  index.css
```

## Services mockados

### `aiService.js`

Contém `MOCK_MODE = true` e as funções:

- `generateItinerary()`
- `recommendPlaces()`
- `getAssistantLoadingMessages()`

Também possui comentários indicando onde futuramente deve entrar a chamada para uma API real de IA.

### `communityService.js`

- Retorna relatos mockados.
- Gera resumo agregado dos relatos.

### `costService.js`

- Retorna custos mockados.
- Estima custo de viagem com base em dias e estilo.

### `destinationService.js`

- Lista destinos populares.
- Busca destino por ID.
- Filtra destinos por texto.

### `tripService.js`

- Retorna viagem ativa.
- Retorna dias e paradas do roteiro.

## Backend

Existe uma pasta `backend` com FastAPI e endpoints criados em uma etapa anterior do projeto. No estado atual, o frontend não depende do backend para funcionar no deploy.

O backend pode ser reaproveitado futuramente para:

- persistir relatos;
- persistir viagens e roteiros;
- autenticar usuários;
- servir dados reais;
- intermediar chamadas para IA e APIs externas.

## Como rodar localmente

### Frontend

```powershell
Set-Location 'C:\Projeto\generativa\ViajaReal\frontend'
npm install
npm run dev
```

A aplicação ficará disponível em:

```text
http://localhost:5173
```

### Build de produção

```powershell
Set-Location 'C:\Projeto\generativa\ViajaReal\frontend'
npm run build
```

### Preview do build

```powershell
Set-Location 'C:\Projeto\generativa\ViajaReal\frontend'
npm run preview
```

## Deploy na Vercel

O deploy atual está configurado como frontend-only.

Endpoint publicado:

```text
https://viaja-real-7ydpnmcb8-rafaela9.vercel.app
```

Configuração usada em `vercel.json`:

```json
{
  "buildCommand": "npm --prefix frontend install && npm --prefix frontend run build",
  "outputDirectory": "frontend/dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Essa configuração garante que rotas do React Router funcionem ao acessar diretamente páginas como:

- `/planner`
- `/timeline`
- `/places`
- `/costs`
- `/community`
- `/assistant`
- `/assistant/result`
- `/profile`

## O que falta implementar

### Integrações reais

- IA real para gerar roteiros, resumos e recomendações.
- API real de mapas/geolocalização além dos marcadores mockados.
- API de clima, eventos, atrações e alertas de segurança.
- Persistência real em banco de dados.
- Upload real de fotos/documentos.

### Produto e conta

- Autenticação de usuários.
- Perfil persistente.
- Favoritos persistentes.
- Viagens salvas por usuário.
- Relatos publicados de verdade.
- Permissões e segurança de conta.

### Funcionalidades avançadas

- CRUD completo de roteiro.
- Edição real de paradas, horários e dias.
- Criação real de gastos com formulário.
- Filtros avançados de relatos.
- Busca global funcionando em todas as entidades.
- Sincronização real entre mapa, lista e roteiro.
- Compartilhamento/exportação de roteiro.

### Qualidade técnica

- Testes automatizados.
- Tratamento de erros mais completo.
- Loading states por rota.
- Code splitting para reduzir o bundle.
- Revisão de acessibilidade.
- Internacionalização ou padronização final dos textos.

## Limitações atuais

- Todos os dados do frontend são mockados.
- O assistente não chama IA real.
- A maioria das ações altera apenas estado local.
- Dados salvos em `localStorage` não são compartilhados entre usuários.
- O backend existe no repositório, mas não está integrado ao fluxo atual do frontend.
- O bundle de produção emite aviso de tamanho por causa de mapa/gráficos; isso não quebra o build, mas pode ser otimizado futuramente com lazy loading.

## Uso do agente de codificação

O projeto foi desenvolvido com uso extensivo do Codex como agente de codificação, com supervisão e ajustes ao longo do processo. O Codex foi usado para:

- implementar a estrutura de páginas, componentes, dados e services;
- corrigir problemas de deploy na Vercel;
- transformar botões visuais em interações mockadas;
- validar build de produção;
- ajustar a interface após feedback de usabilidade;
- atualizar documentação.

### Exemplos de prompts usados

Alguns prompts representativos usados durante o desenvolvimento:

- "Analise o código do ViajaReal. Localmente todas as páginas funcionam, mas no deploy da Vercel as páginas de detalhes e relatório ficam vazias. Verifique a causa e ajuste para que o frontend funcione corretamente em produção."
- "Implemente no projeto ViajaReal as telas e funcionalidades baseadas no mockup visual enviado. A aplicação deve ser uma plataforma de planejamento de viagens inspirada no Wanderlog, usando React, Vite, Tailwind CSS, React Router, Lucide React, Recharts e React Leaflet, com dados mockados separados em `src/data`, services em `src/services`, componentes reutilizáveis e páginas separadas."
- "Crie as telas Dashboard, Página de Destino, Planejador de Roteiro, Timeline por Dia, Mapa de Lugares, Controle de Custos, Relatos da Comunidade, Assistente de Viagem Mockado, Resultado do Assistente e Perfil/Configurações. As telas devem navegar entre si e funcionar sem backend real."
- "A primeira versão não ficou usual no desktop. Ajuste a experiência para ficar responsiva, com menu lateral no desktop, navegação inferior no mobile, melhor aproveitamento de tela e cards mais organizados."
- "Verifique por que nem todas as funcionalidades estão operáveis no deploy. Transforme botões e abas que estavam apenas visuais em interações mockadas funcionais, como filtros, alternância de abas, adicionar parada, adicionar gasto, salvar roteiro e menu de perfil."
- "Atualize o README com as mudanças do projeto, explicando o que está implementado, o que falta implementar, as limitações atuais, como rodar localmente, como funciona o deploy na Vercel e como a IA poderá ser integrada futuramente."

Esses prompts mostram que o desenvolvimento foi iterativo: primeiro houve geração de estrutura e telas, depois correção de problemas reais de deploy, melhoria de usabilidade e documentação.

## O que funcionou bem

- O Codex conseguiu criar rapidamente uma estrutura modular com `data`, `services`, `components` e `pages`.
- A geração das telas principais foi eficiente para cobrir um escopo grande em pouco tempo.
- A separação dos dados mockados facilitou deixar os componentes mais limpos.
- O uso de React Router, Tailwind, Recharts e React Leaflet deixou a aplicação mais próxima de um produto real.
- O agente identificou problemas típicos de deploy SPA na Vercel e ajustou o fallback de rotas.
- A validação com build de produção ajudou a encontrar problemas antes do deploy.

## O que não funcionou bem e precisou de intervenção

- A primeira versão baseada no mockup ficou muito presa ao formato mobile, com largura limitada, e não ficou usual no desktop.
- Algumas interações foram inicialmente apenas visuais, como abas, filtros e botões. Depois precisaram ser corrigidas para operar com estado local.
- O deploy exigiu ajuste no `vercel.json`, porque a aplicação passou a ser frontend-only e precisava de fallback para rotas do React.
- A integração real com backend e IA ficou fora do escopo desta etapa.
- O bundle ficou grande por causa de mapa e gráficos; futuramente seria melhor aplicar code splitting/lazy loading.
- O README antigo ficou desatualizado depois das mudanças e precisou ser reescrito para refletir o estado real do projeto.

Se fosse feito novamente, uma melhoria seria começar pela arquitetura responsiva desktop/mobile antes de copiar a estética do mockup, além de definir desde o início quais botões deveriam ter comportamento mockado obrigatório.

## Última validação

Validações feitas durante a implementação:

- `npm run build` executado com sucesso no frontend.
- Rotas diretas testadas localmente retornando `200`:
  - `/planner`
  - `/assistant/result`
  - `/costs`

## Resumo

O ViajaReal hoje é uma demonstração frontend funcional e navegável de uma plataforma de planejamento de viagens. Ele já apresenta as principais telas e fluxos de produto com dados mockados, mas ainda precisa de backend integrado, persistência, autenticação e IA real para se tornar uma aplicação completa.
