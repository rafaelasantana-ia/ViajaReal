import sqlite3
from pathlib import Path
from typing import List

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

DB_PATH = Path(__file__).resolve().parent / "viajareal.db"

app = FastAPI(
    title="ViajaReal API",
    description="API para explorar destinos, relatos anônimos e insights simulados de viagem.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class DestinationBase(BaseModel):
    name: str = Field(..., example="Lisboa")
    country: str = Field(..., example="Portugal")
    region: str = Field(..., example="Europa")
    budget: str = Field(..., example="R$ 3.800")
    safety: str = Field(..., example="Alta")
    transit: str = Field(..., example="Ótimo")
    stay: str = Field(..., example="Boa")
    rating: float = Field(..., example=4.7)
    tags: str = Field(..., example="Turismo,Trens,Restaurantes")
    report: str = Field(..., example="Transporte simples e bairros seguros.")
    summary: str = Field(..., example="Ótima opção para quem quer custo equilibrado.")


class StoryBase(BaseModel):
    title: str = Field(..., example="Hostel bem localizado")
    destination: str = Field(..., example="Lisboa")
    cost: str = Field(..., example="R$ 280/noite")
    safety: str = Field(..., example="Boa")
    story: str = Field(..., example="Fiquei perto do metrô e senti segurança à noite.")


class StoryCreate(StoryBase):
    pass


class InsightResponse(BaseModel):
    title: str
    text: str


class AlertResponse(BaseModel):
    level: str
    message: str


class StatsResponse(BaseModel):
    average_cost: str
    safety_level: str
    popular_destination: str


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_connection()
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS destinations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            country TEXT NOT NULL,
            region TEXT NOT NULL,
            budget TEXT NOT NULL,
            safety TEXT NOT NULL,
            transit TEXT NOT NULL,
            stay TEXT NOT NULL,
            rating REAL NOT NULL,
            tags TEXT NOT NULL,
            report TEXT NOT NULL,
            summary TEXT NOT NULL
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS stories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            destination TEXT NOT NULL,
            cost TEXT NOT NULL,
            safety TEXT NOT NULL,
            story TEXT NOT NULL
        )
        """
    )
    conn.commit()
    conn.close()


init_db()


@app.on_event("startup")
def startup_event():
    conn = get_connection()
    destination_count = conn.execute("SELECT COUNT(*) as count FROM destinations").fetchone()["count"]
    story_count = conn.execute("SELECT COUNT(*) as count FROM stories").fetchone()["count"]
    conn.close()
    if destination_count == 0:
        seed_data()
    if story_count == 0:
        seed_stories()


def seed_data():
    conn = get_connection()
    conn.executemany(
        """
        INSERT INTO destinations (name, country, region, budget, safety, transit, stay, rating, tags, report, summary)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        [
            (
                "Lisboa",
                "Portugal",
                "Europa",
                "R$ 3.800",
                "Alta",
                "Ótimo",
                "Boa",
                4.7,
                "Turismo,Trens,Restaurantes",
                "Muitos relatos destacam transporte simples e bairros bem iluminados.",
                "Ideal para quem busca custo equilibrado e boa mobilidade urbana.",
            ),
            (
                "Tóquio",
                "Japão",
                "Ásia",
                "R$ 6.100",
                "Muito alta",
                "Excelente",
                "Excelente",
                4.9,
                "Segurança,Metrô,Tecnologia",
                "Relatos apontam facilidade de locomoção e excelente organização urbana.",
                "Boa opção para viajantes que valorizam estrutura e segurança.",
            ),
            (
                "Marrakech",
                "Marrocos",
                "África",
                "R$ 2.900",
                "Média",
                "Boa",
                "Regular",
                4.1,
                "Cultura,Mercados,Preço",
                "Há relatos de boa experiência cultural, mas com mais atenção a negociações.",
                "Custo acessível, porém exige mais planejamento para transporte e hospedagem.",
            ),
        ],
    )
    conn.commit()
    conn.close()


def seed_stories():
    conn = get_connection()
    conn.executemany(
        """
        INSERT INTO stories (title, destination, cost, safety, story)
        VALUES (?, ?, ?, ?, ?)
        """,
        [
            (
                "Hospedagem barata em Lisboa",
                "Lisboa",
                "R$ 280/noite",
                "Boa",
                "Fiquei perto do metrô e senti boa segurança à noite.",
            ),
            (
                "Transporte eficiente em Tóquio",
                "Tóquio",
                "R$ 420/noite",
                "Alta",
                "As linhas de trem foram fáceis de usar e reduziram muito o tempo de deslocamento.",
            ),
            (
                "Cuidado com custos em Marrakech",
                "Marrakech",
                "R$ 180/noite",
                "Moderada",
                "Os passeios guiados ficaram mais caros do que o esperado.",
            ),
        ],
    )
    conn.commit()
    conn.close()


@app.get("/health", summary="Verifica saúde da API", description="Endpoint simples para confirmar que a API está no ar.")
def health():
    return {"status": "ok"}


@app.get("/destinations", response_model=List[dict], summary="Lista destinos", description="Retorna todos os destinos cadastrados com dados de exemplo.")
def list_destinations():
    conn = get_connection()
    rows = conn.execute("SELECT * FROM destinations ORDER BY id ASC").fetchall()
    conn.close()
    return [dict(row) for row in rows]


@app.get("/destinations/search", response_model=List[dict], summary="Busca destino por nome", description="Busca destinos por nome parcial, ignorando maiúsculas/minúsculas.")
def search_destinations(q: str = Query(..., min_length=1, description="Nome ou parte do nome do destino")):
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM destinations WHERE lower(name) LIKE ? ORDER BY id ASC",
        (f"%{q.lower()}%",),
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


@app.post("/stories", response_model=dict, summary="Cadastra relato anônimo", description="Cria um novo relato anônimo para um destino.")
def create_story(payload: StoryCreate):
    conn = get_connection()
    cursor = conn.execute(
        "INSERT INTO stories (title, destination, cost, safety, story) VALUES (?, ?, ?, ?, ?)",
        (payload.title, payload.destination, payload.cost, payload.safety, payload.story),
    )
    conn.commit()
    story_id = cursor.lastrowid
    conn.close()
    return {"id": story_id, "message": "Relato cadastrado com sucesso."}


@app.get("/stories/by-destination", response_model=List[dict], summary="Lista relatos por destino", description="Retorna todos os relatos associados a um destino.")
def list_stories_by_destination(destination: str = Query(..., description="Nome do destino")):
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM stories WHERE lower(destination) = ? ORDER BY id DESC",
        (destination.lower(),),
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


@app.get("/stats/cost-average", response_model=StatsResponse, summary="Estatísticas simuladas", description="Retorna uma média simulada de custo, nível de segurança e destino mais citado.")
def cost_average():
    return {
        "average_cost": "R$ 360/dia",
        "safety_level": "Alta",
        "popular_destination": "Lisboa",
    }


@app.get("/insights/summary", response_model=List[InsightResponse], summary="Resumo inteligente mockado", description="Retorna um resumo textual simulado com base em dados fictícios de viagem.")
def summary_mock():
    return [
        {
            "title": "Melhor relação custo/benefício",
            "text": "Lisboa aparece como a opção mais equilibrada para quem quer conforto sem exagerar no orçamento.",
        },
        {
            "title": "Mais segura",
            "text": "Tóquio é a escolha mais forte para quem prioriza segurança e organização.",
        },
        {
            "title": "Mais econômica",
            "text": "Marrakech é ideal para quem quer uma experiência cultural com investimento mais baixo.",
        },
    ]


@app.get("/alerts", response_model=List[AlertResponse], summary="Alertas simulados", description="Retorna alertas simulados para o destino consultado.")
def destination_alerts(destination: str = Query(..., description="Nome do destino")):
    alerts = {
        "Lisboa": [
            {"level": "info", "message": "Transporte público funciona bem e o centro é bem servido."},
        ],
        "Tóquio": [
            {"level": "warning", "message": "Alguns bairros têm custo elevado em hospedagem durante feriados."},
        ],
        "Marrakech": [
            {"level": "warning", "message": "Negociações de passeios podem encarecer o orçamento."},
        ],
    }

    if destination.lower() not in {key.lower(): key for key in alerts}:
        raise HTTPException(status_code=404, detail="Destino não encontrado.")

    return alerts[destination]
