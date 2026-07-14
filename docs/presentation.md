# Roteiro de apresentação — 3 minutos

## 0:00–0:30 — problema e solução

“O ViajaReal centraliza pesquisa, relatos, orçamento e planejamento de viagens. A IA não trabalha sozinha: ela entende a intenção e usa tools determinísticas para consultar dados, calcular valores e montar uma resposta estruturada.”

## 0:30–2:30 — decisões de engenharia de LLM

“A arquitetura é React no frontend e FastAPI no backend. O fluxo é frontend, route, service, AIService, modelo, tools, validação Pydantic e resposta. Escolhi chamadas diretas em vez de LangChain porque o ciclo é pequeno, preciso de apenas um modelo e quero manter seleção de tools e fallbacks visíveis.”

“O provider principal é Ollama com llama3.2 porque é gratuito, local e preserva privacidade. A desvantagem é maior latência e menor consistência de JSON e tool calling. Groq pode ser ativado pelo mesmo adapter. Com um modelo pago maior, eu esperaria melhor síntese e aderência ao schema, mas manteria validações e cálculos no backend.”

“Uso temperatura 0.3, top-p 0.9, 600 tokens, timeout de 90 segundos e no máximo dois ciclos de tools. Testei temperaturas 0, 0.3 e 0.7; as três produziram JSON válido em uma amostra curta. Mantive 0.3 para reduzir variação sem deixar a linguagem totalmente rígida.”

“O system prompt define persona, escopo de viagens, proibição de inventar dados, proteção contra prompt injection, pergunta única e saída JSON. Uso few-shot para planejamento, orçamento e ausência de dados. Para o modelo local, criei versões compactas porque o prompt completo chegou perto de 50 segundos e piorou a obediência.”

“As seis tools existem para manter fatos e cálculos fora da geração livre: relatos, dados do destino, orçamento, roteiro-base, comparação e contexto real. O modelo só vê tools compatíveis com a intenção. Resultados são validados e o backend possui fallback explícito.”

## 2:30–3:00 — resultados e limitações

“O que funcionou melhor foi grounding com tools, structured output e separação entre estatísticas e síntese. O que falhou foi a consistência do modelo local com prompt longo, JSON e nomes ambíguos como Bonito. Corrigi com prompts compactos, schemas, desambiguação e fallback. A principal limitação é que destinos fora do catálogo não recebem roteiro inventado.”

## Perguntas prováveis

### Por que temperatura 0.3?

Porque a tarefa exige consistência factual e JSON, mas a síntese ainda precisa soar natural. Temperatura 0 seria mais rígida; 0.7 aumenta variação sem benefício claro para cálculos e tools.

### Por que `top_p=0.9` junto com temperatura?

Mantém um conjunto amplo de tokens candidatos, enquanto a temperatura baixa controla a aleatoriedade. Na próxima evolução eu isolaria os experimentos de cada parâmetro com várias repetições.

### Por que não LangChain ou LangGraph?

Há um único modelo, seis tools e poucos ciclos. Implementação direta reduz dependências, facilita depuração e deixa o comportamento demonstrável. Um framework faria sentido com fluxos maiores, persistência complexa ou vários agentes.

### Por que não RAG?

Os dados atuais são pequenos e estruturados. Tools filtram o catálogo com precisão. RAG faria sentido com grande volume de guias, documentos e relatos semiestruturados.

### O que acontece com prompt injection?

O código bloqueia padrões básicos antes da LLM, limita entrada e histórico, separa conteúdos em envelopes não confiáveis e valida tools. Não é possível eliminar totalmente prompt injection, por isso regras críticas não dependem apenas do modelo.

### Por que a LLM não calcula orçamento?

Somar valores é determinístico. A tool calcula e a LLM apenas explica o resultado, evitando erro aritmético e facilitando testes.

### O que mudaria com um modelo pago?

Melhoraria latência, tool calling, aderência ao JSON e síntese. A arquitetura, validações, tools e proteção de segredos permaneceriam.

### Qual foi a principal falha encontrada?

O prompt longo com few-shot piorou a latência e a interpretação do llama3.2. A solução foi manter o prompt principal documentado e criar derivações compactas específicas para o provider local.
