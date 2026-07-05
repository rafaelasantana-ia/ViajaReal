from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent / "viajareal.db"

app = FastAPI(title="ViajaReal API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_connection()
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS stories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            city TEXT NOT NULL,
            country TEXT NOT NULL,
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
    count = conn.execute("SELECT COUNT(*) as count FROM stories").fetchone()["count"]
    conn.close()
    if count == 0:
        seed_data()


def seed_data():
    conn = get_connection()
    conn.executemany(
        """
        INSERT INTO stories (title, city, country, cost, safety, story)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        [
            (
                "Hospedagem barata em Lisboa",
                "Lisboa",
                "Portugal",
                "€90 por noite",
                "Boa",
                "A hospedagem estava bem localizada e o bairro era seguro à noite.",
            ),
            (
                "Transporte eficiente em Tóquio",
                "Tóquio",
                "Japão",
                "¥3.500 por dia",
                "Excelente",
                "As linhas de trem foram fáceis de usar e reduziram muito o tempo de deslocamento.",
            ),
            (
                "Cuidado com custos em Marrakech",
                "Marrakech",
                "Marrocos",
                "MAD 600 no total",
                "Moderada",
                "Os passeios guiados ficaram mais caros do que o esperado, então vale reservar com antecedência.",
            ),
        ],
    )
    conn.commit()
    conn.close()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/stories")
def list_stories():
    conn = get_connection()
    rows = conn.execute("SELECT * FROM stories ORDER BY id DESC").fetchall()
    conn.close()
    return [dict(row) for row in rows]


@app.get("/mock-ai-tip")
def mock_ai_tip():
    return {"tip": "Use transporte público e reserve hospedagem com cancelamento flexível para reduzir custos."}
