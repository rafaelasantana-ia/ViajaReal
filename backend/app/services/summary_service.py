"""Serviço para gerar resumos inteligentes mockados de destino.

Futuro: substituir por um modelo de IA, regras heurísticas avançadas ou integração com LLM.
"""

from typing import Any, Dict, List


def generate_destination_summary(reports: List[Dict[str, Any]], preferences: Dict[str, Any], external_info: Dict[str, Any]) -> Dict[str, Any]:
    """Gera um resumo simulado com base em relatos, preferências e dados externos."""
    if not reports:
        return {
            "summary": "Nenhum relato suficiente para gerar uma recomendação confiável no momento.",
            "positives": ["Dados ainda incompletos para análise"],
            "attention_points": ["Aguardando mais relatos e confirmação externa"],
            "average_cost": external_info.get("price_average", "R$ 0/dia"),
            "recommended_itinerary": ["Explore os principais pontos do destino", "Reserve espaço para descanso"],
            "suggestion": "Tente ajustar os filtros para gerar uma sugestão mais precisa.",
            "verification_status": "not_verified",
        }

    average_rating = round(sum(report.get("rating", 0) for report in reports) / len(reports), 2)
    positives = []
    attention_points = []

    for report in reports:
        if report.get("summary"):
            positives.append(report["summary"])

    if preferences.get("safe"):
        attention_points.append("Priorize destinos com avaliação de segurança compatível com o perfil.")
    if preferences.get("accessible"):
        attention_points.append("Considere a mobilidade local e acessibilidade dos pontos principais.")

    # Futuro: aqui entraria um modelo de IA para resumir, comparar custos e personalizar.
    return {
        "summary": f"Com base em {len(reports)} relatos, o destino se destaca para perfis com interesse em {', '.join(preferences.get('interests', [])) or 'variedade'}.",
        "positives": positives[:3],
        "attention_points": attention_points or ["Atenção a custo e logística local."],
        "average_cost": external_info.get("price_average", "R$ 0/dia"),
        "recommended_itinerary": [
            "Comece pelo centro ou região mais conectada ao seu hotel",
            "Inclua uma atividade principal por dia",
            "Reserve tempo para refeições e descanso",
        ],
        "suggestion": f"O perfil mais alinhado é {external_info.get('ideal_traveler', 'viajante geral')}.",
        "verification_status": "not_verified",
        "average_rating": average_rating,
    }
