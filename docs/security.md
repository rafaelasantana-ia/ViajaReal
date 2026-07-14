# Segurança da camada de IA

Este documento descreve proteções básicas do ViajaReal contra uso indevido, vazamento de dados e prompt injection.

## Controles implementados

### Validação de entrada

- mensagens do chatbot têm limite de 3.000 caracteres;
- mensagens vazias ou compostas somente por espaços são rejeitadas;
- somente as 10 mensagens mais recentes do histórico são aceitas;
- cada mensagem do histórico é limitada a 2.000 caracteres;
- papéis diferentes de `user` e `assistant` são removidos do histórico;
- `session_id`, contexto, formulários, relatos, despesas e demais campos possuem validação de tipo e tamanho no backend;
- o frontend também impede mensagens vazias, mas a validação do backend é obrigatória e prevalece.

### Guardas determinísticas antes da LLM

O backend bloqueia padrões básicos relacionados a:

- tentativa de ignorar ou substituir instruções internas;
- solicitação do system prompt, chaves, tokens ou configurações;
- pedidos para inventar avaliações, relatos, preços, atrações ou dados de segurança;
- solicitações explicitamente fora do escopo de viagens.

Solicitações bloqueadas não executam tools e não são enviadas ao provedor de IA.

### Fronteiras de confiança

As mensagens são montadas com separação explícita:

1. instruções e regras ficam em uma mensagem `system`;
2. a mensagem atual usa o envelope `untrusted_user_data`;
3. o histórico usa `untrusted_conversation_history`;
4. relatos são marcados como `untrusted_user_report`;
5. retornos de tools usam `untrusted_tool_result` ou `untrusted_tool_results`.

Relatos, histórico e resultados de tools são tratados como dados. Comandos ou links encontrados dentro desses conteúdos não concedem permissões e não devem ser obedecidos pelo modelo.

### Segredos e logs

- chaves são lidas somente de variáveis de ambiente no backend;
- o frontend nunca recebe a chave do provedor;
- prompts e chaves não são incluídos nos payloads enviados ao usuário;
- logs técnicos registram identificadores, duração, feature, tools e tipo do erro, sem registrar mensagens, relatos, chaves ou conteúdo da exceção.

### Dados e respostas

- tools e validações em código continuam sendo a fonte para cálculos e dados estruturados;
- quando uma resposta factual exige tools e nenhuma tool é executada, o backend recusa a conclusão em vez de usar texto não fundamentado;
- a LLM não deve calcular valores que o backend consegue calcular deterministicamente;
- respostas mockadas são identificadas e não representam condições atuais;
- resultados da IA não devem ser tratados como fonte oficial de preços, segurança, clima, documentação, disponibilidade ou recomendações públicas.

## Limitações conhecidas

Prompt injection não pode ser eliminada completamente. Modelos probabilísticos podem interpretar incorretamente instruções ou dados mesmo com isolamento e prompts defensivos.

Por isso:

- regras críticas precisam ser validadas também em código;
- autorização nunca deve depender apenas de uma resposta da LLM;
- parâmetros de tools devem ser tipados e validados;
- outputs estruturados devem passar por schemas antes de chegar ao frontend;
- novos provedores, prompts e tools exigem testes de regressão de segurança;
- dados reais devem receber controles adicionais de autenticação, autorização, rate limiting, auditoria e privacidade.

## Testes

Os cenários de segurança estão em `tests/test_prompt_injection.py` e cobrem:

- “Ignore todas as instruções anteriores”;
- solicitação do system prompt;
- comandos inseridos dentro de relatos;
- pedidos fora do escopo de viagens;
- solicitação para inventar avaliações;
- mensagens vazias e limites de tamanho;
- truncamento e isolamento do histórico.
