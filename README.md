# ViajaReal

## Descrição do problema

A decisão de viajar muitas vezes é influenciada por falta de informação confiável, dificuldade em comparar custos, pouca clareza sobre segurança e pouca personalização. Muitas pessoas recorrem a opiniões dispersas em redes sociais, mas não conseguem transformar esses relatos em uma recomendação prática e organizada.

Este projeto nasceu para oferecer uma experiência inicial de planejamento de viagens com base em relatos compartilhados por outros viajantes, com uma arquitetura preparada para evoluir para uma solução com IA.

## Solução proposta

A proposta foi criar uma aplicação fullstack que simula uma experiência de busca inteligente de destinos, permitindo:
- pesquisar destinos com base em palavras-chave;
- aplicar filtros de preferências do usuário;
- visualizar um resumo inteligente mockado do destino;
- consultar relatos compartilhados;
- cadastrar novos relatos com dados estruturados;
- preparar a aplicação para futuras integrações com IA, mapas e busca na internet.

A ideia central é transformar relatos de viagem em uma base de conhecimento útil, mesmo que, nesta etapa, os dados ainda sejam mockados.

## Como a IA seria integrada futuramente

A estrutura atual foi pensada para facilitar a evolução para um fluxo com IA real. Futuramente, a aplicação pode integrar:
- modelos de linguagem para gerar resumos inteligentes e recomendações personalizadas;
- APIs externas de clima, eventos, notícias, atrações e segurança;
- serviços de mapas e geolocalização, como Google Maps ou OpenStreetMap;
- análise de relatos para identificar padrões, comparar custos e sugerir melhores destinos para cada perfil.

No momento, esses fluxos foram representados por services mockados, com comentários indicando onde as integrações reais entrariam.

## Arquitetura escolhida

### Frontend
- React + Vite
- Interface modular para dashboard, busca de destino, detalhes, formulário de relatos e comparador
- Estado local para simular o comportamento futuro da aplicação

### Backend
- FastAPI
- SQLite para persistência inicial de destinos e relatos
- Services separados para organização da lógica de negócio

### Estrutura do backend
- app/main.py: API principal e endpoints
- app/services/: lógica organizada em módulos separados
  - external_info_service.py: busca de dados públicos mockados
  - reports_service.py: filtro de relatos do usuário
  - expenses_service.py: cálculo de gastos
  - summary_service.py: resumo inteligente mockado
  - validation_service.py: validação de relatos
  - maps_service.py: integração mockada com mapas
  - mock_examples.py: exemplos de dados para testes

## Telas implementadas

### 1. Dashboard
- resumo geral da aplicação
- métricas simuladas
- últimos relatos cadastrados

### 2. Buscar destino
- campo de pesquisa
- sugestões mockadas de destinos
- filtros de preferências
- resumo inteligente do destino
- relatos encontrados
- área de mapa mockada
- estado de carregamento para simular geração de sugestão
- mensagem para quando nenhum relato for encontrado

### 3. Detalhes do destino
- resumo do destino escolhido
- métricas básicas de segurança, transporte e hospedagem
- comparação estimada de custos

### 4. Adicionar relato
- formulário completo com dados de viagem, gastos, experiência, avaliações, localização e resumo
- validação básica para campos obrigatórios
- preparação para futura análise de IA

### 5. Comparador e resumo mockado
- comparativo de destinos
- visão consolidada com insights simulados

## Endpoints criados

### Endpoints existentes
- GET /health: verificação de saúde da API
- GET /destinations: lista destinos
- GET /destinations/search: busca por nome de destino
- POST /stories: cadastro de relato
- GET /stories/by-destination: lista relatos por destino
- GET /stats/cost-average: estatísticas mockadas
- GET /insights/summary: resumo inteligente mockado
- GET /alerts: alertas simulados

### Endpoints de estrutura futura
- GET /future-services/external-info: retorna dados públicos mockados de um destino
- GET /future-services/reports: filtra relatos mockados por perfil e destino
- POST /future-services/expenses: calcula gastos da viagem
- POST /future-services/summary: gera resumo inteligente mockado
- POST /future-services/validate-report: valida relato de forma simulada
- GET /future-services/map-coordinates: retorna coordenadas mockadas de um local
- POST /future-services/map-markers: gera marcadores mockados para o mapa
- GET /future-services/mock-examples: retorna exemplos de dados para testes

## Como rodar o projeto

### Backend
```powershell
Set-Location 'c:\Projetos\atividade ia generativa\backend'
.\.venv\Scripts\python -m pip install -r requirements.txt
.\.venv\Scripts\python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend
```powershell
Set-Location 'c:\Projetos\atividade ia generativa\frontend'
npm install
npm run dev
```

A aplicação ficará disponível em:
- Frontend: http://localhost:5173
- Backend: http://127.0.0.1:8000

## Prompts usados no Codex

Os prompts utilizados durante o desenvolvimento foram voltados para:
- criar uma aplicação fullstack com React + Vite + FastAPI;
- estruturar uma tela moderna para busca de destino;
- implementar formulários de cadastro de relato;
- separar a lógica em services para futura integração com IA;
- preparar endpoints mockados e exemplos de dados;
- documentar a execução e o fluxo da aplicação.

Exemplos de instruções usadas:
- "Crie uma aplicação fullstack de viagens com frontend em React e backend em FastAPI."
- "Melhore a tela de buscar destino com filtros, resumo mockado e relatos."
- "Crie uma estrutura inicial de serviços para IA, mapas e análise de relatos."
- "Atualize o README para avaliação intermediária com contexto técnico e execução."

## O que funcionou bem

- A proposta ficou bem organizada e com boa separação entre frontend e backend.
- A interface ficou mais completa e visualmente consistente.
- Os services mockados deixaram a aplicação preparada para evolução.
- O projeto já possui fluxo de cadastro, busca e visualização de viagens.
- A estrutura ficou pronta para integração futura com IA e APIs externas.

## O que não funcionou

- A integração com IA real ainda não foi implementada.
- Os dados continuam sendo mockados, então não há análise automatizada confiável ainda.
- O backend ainda não consome APIs externas reais.
- O mapa e os resumos são simulação visual, não um resultado processado por um modelo.

## Limitações encontradas

- Falta de integração com serviços reais de busca, clima, notícias e mapas.
- A validação de relatos é apenas inicial e simbólica.
- A experiência de recomendação depende de dados estruturados e mais ricos.
- Não há autenticação de usuários nem persistência avançada de perfil.
- O projeto ainda não possui uma camada de IA treinada ou conexão com um modelo externo.

## Próximos passos

1. Conectar a tela de busca de destino aos endpoints de services futuros.
2. Integrar uma API real de mapas e geolocalização.
3. Substituir os dados mockados por fontes externas e/ou um modelo de IA.
4. Melhorar os campos de relato para capturar mais contexto útil.
5. Implementar análise automatizada de custo, segurança, pontos positivos e roteiro.
6. Evoluir a experiência para um app mais próximo do produto final, com autenticação e cadastro real de usuários.

