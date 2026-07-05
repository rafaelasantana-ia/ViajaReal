"""Serviço para calcular custos de viagem com dados mockados."""

from typing import Any, Dict


def calculate_trip_expenses(expenses: Dict[str, Any]) -> Dict[str, Any]:
    """Calcula o total e o gasto médio por dia com base em categorias de custo."""
    food = float(expenses.get("food", 0) or 0)
    transport = float(expenses.get("transport", 0) or 0)
    lodging = float(expenses.get("lodging", 0) or 0)
    activities = float(expenses.get("activities", 0) or 0)
    shopping = float(expenses.get("shopping", 0) or 0)
    others = float(expenses.get("others", 0) or 0)

    total = food + transport + lodging + activities + shopping + others
    duration_days = int(expenses.get("duration_days", 1) or 1)
    average_per_day = round(total / duration_days, 2) if duration_days else round(total, 2)

    # Futuro: adicionar regras de conversão de moeda, sazonalidade e tendências de preço.
    return {
        "food": food,
        "transport": transport,
        "lodging": lodging,
        "activities": activities,
        "shopping": shopping,
        "others": others,
        "total": round(total, 2),
        "average_per_day": average_per_day,
        "currency": expenses.get("currency", "BRL"),
    }
