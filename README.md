# ViajaReal

ViajaReal é uma aplicação de planejamento de viagens inspirada em experiências reais de viajantes. A versão atual funciona como uma SPA em React com dados mockados, interface responsiva, navegação entre telas e simulações de roteiro, custos, mapa, relatos e assistente de viagem.

O projeto está preparado para evoluir para integrações reais com IA, APIs externas, autenticação e persistência, mas nesta etapa o foco é demonstrar a experiência completa no frontend.

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

## Última validação

Validações feitas durante a implementação:

- `npm run build` executado com sucesso no frontend.
- Rotas diretas testadas localmente retornando `200`:
  - `/planner`
  - `/assistant/result`
  - `/costs`

## Resumo

O ViajaReal hoje é uma demonstração frontend funcional e navegável de uma plataforma de planejamento de viagens. Ele já apresenta as principais telas e fluxos de produto com dados mockados, mas ainda precisa de backend integrado, persistência, autenticação e IA real para se tornar uma aplicação completa.
