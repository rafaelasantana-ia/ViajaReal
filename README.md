# ViajaReal

ViajaReal é uma plataforma fullstack para compartilhar relatos anônimos de viagem com foco em custos reais, transporte, hospedagem, segurança e dicas úteis.

## Stack
- Frontend: React + Vite
- Backend: FastAPI
- Banco: SQLite
- IA: respostas mockadas, sem integração a modelos externos

## Estrutura
- frontend/: aplicação web
- backend/: API FastAPI e banco SQLite

## Como executar

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

A aplicação ficará disponível em http://localhost:5173 e a API em http://127.0.0.1:8000.
