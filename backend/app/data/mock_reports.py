"""Relatos mockados associados ao catálogo brasileiro."""

from typing import List


def _report(
    report_id: str,
    destination_id: str,
    travel_type: str,
    days: int,
    budget: float,
    food: float,
    transport: float,
    lodging: float,
    activities: float,
    rating: float,
    story: str,
    positives: List[str],
    negatives: List[str],
    recommended_places: List[str],
    date: str,
    anonymous_author: str,
):
    return {
        "id": report_id,
        "destination_id": destination_id,
        "travel_type": travel_type,
        "days": days,
        "budget": budget,
        "total_spent": food + transport + lodging + activities,
        "food": food,
        "transport": transport,
        "lodging": lodging,
        "activities": activities,
        "rating": rating,
        "story": story,
        "positives": positives,
        "negatives": negatives,
        "recommended_places": recommended_places,
        "date": date,
        "anonymous_author": anonymous_author,
    }


MOCK_REPORTS = [
    _report("rel-fln-01", "florianopolis-sc", "casal", 6, 4200, 720, 380, 1580, 620, 4.8, "Dividimos os dias entre praias do leste, centro histórico e gastronomia em Santo Antônio.", ["Praias variadas", "Boa gastronomia", "Paisagens"], ["Trânsito no fim da tarde"], ["Praia Mole", "Santo Antônio de Lisboa", "Lagoa da Conceição"], "2026-03-18", "Viajante anônimo 01"),
    _report("rel-fln-02", "florianopolis-sc", "amigos", 5, 3500, 680, 520, 1200, 430, 4.5, "Ficamos perto da Lagoa e usamos transporte por aplicativo para praias e trilhas.", ["Vida noturna", "Trilhas", "Opções de praia"], ["Deslocamentos caros sem carro"], ["Lagoa da Conceição", "Trilha da Lagoinha do Leste"], "2026-02-10", "Viajante anônimo 02"),
    _report("rel-fln-03", "florianopolis-sc", "família", 7, 6000, 1050, 650, 2450, 700, 4.6, "A viagem funcionou bem com crianças, mas planejamos apenas uma região da ilha por dia.", ["Praias", "Restaurantes", "Passeios ao ar livre"], ["Congestionamento na alta temporada"], ["Santo Antônio de Lisboa", "Mercado Público"], "2026-01-22", "Viajante anônimo 03"),

    _report("rel-rio-01", "rio-de-janeiro-rj", "casal", 5, 5200, 900, 480, 2100, 820, 4.7, "Combinamos atrações clássicas, praia e museus, usando metrô durante o dia.", ["Paisagens", "Programação cultural", "Metrô útil"], ["Ingressos e alimentação caros"], ["Cristo Redentor", "Museu do Amanhã", "Copacabana"], "2026-04-02", "Viajante anônimo 04"),
    _report("rel-rio-02", "rio-de-janeiro-rj", "solo", 4, 3400, 620, 350, 1350, 590, 4.3, "Hospedei-me perto do metrô e concentrei os passeios em regiões conectadas.", ["Mobilidade por metrô", "Praias urbanas", "Museus"], ["Necessidade de atenção constante"], ["Jardim Botânico", "Pão de Açúcar"], "2026-03-11", "Viajante anônimo 05"),
    _report("rel-rio-03", "rio-de-janeiro-rj", "família", 6, 7500, 1300, 720, 2800, 1250, 4.6, "Reservamos atrações com horário e alternamos passeios longos com tardes mais leves.", ["Atrações para várias idades", "Paisagens", "Restaurantes"], ["Trânsito e filas"], ["Cristo Redentor", "Pão de Açúcar", "Jardim Botânico"], "2026-01-15", "Viajante anônimo 06"),

    _report("rel-ssa-01", "salvador-ba", "casal", 5, 3800, 760, 360, 1450, 520, 4.7, "O centro histórico e a culinária foram os destaques, com deslocamentos planejados por aplicativo.", ["Cultura", "Comida", "Música"], ["Abordagens comerciais insistentes"], ["Pelourinho", "Farol da Barra", "Mercado Modelo"], "2026-03-25", "Viajante anônimo 07"),
    _report("rel-ssa-02", "salvador-ba", "amigos", 4, 3000, 650, 430, 980, 390, 4.4, "Visitamos atrações históricas durante o dia e a orla no fim da tarde.", ["História", "Pôr do sol", "Vida cultural"], ["Calor intenso"], ["Elevador Lacerda", "Pelourinho", "Farol da Barra"], "2026-02-18", "Viajante anônimo 08"),
    _report("rel-ssa-03", "salvador-ba", "família", 6, 5600, 1120, 610, 1950, 690, 4.5, "Organizamos um roteiro mais lento entre o centro, Barra e um dia de praia.", ["Diversidade cultural", "Praias", "Gastronomia"], ["Deslocamentos demorados"], ["Praia do Flamengo", "Mercado Modelo"], "2026-01-09", "Viajante anônimo 09"),

    _report("rel-gra-01", "gramado-rs", "casal", 4, 5200, 980, 300, 2100, 860, 4.6, "A viagem foi confortável e gastronômica, mas atrações e hospedagem exigiram reserva.", ["Restaurantes", "Organização", "Ambiente romântico"], ["Preços elevados"], ["Lago Negro", "Rua Coberta"], "2026-05-12", "Viajante anônimo 10"),
    _report("rel-gra-02", "gramado-rs", "família", 5, 7200, 1200, 500, 2600, 1420, 4.5, "As crianças aproveitaram os parques; compramos ingressos antecipados para controlar os dias.", ["Atrações familiares", "Limpeza", "Atendimento"], ["Muitas atrações pagas"], ["Mini Mundo", "Snowland", "Lago Negro"], "2026-04-20", "Viajante anônimo 11"),
    _report("rel-gra-03", "gramado-rs", "amigos", 3, 3600, 760, 420, 1250, 620, 4.2, "Fizemos um roteiro curto no centro e usamos carro para pontos mais distantes.", ["Gastronomia", "Centro caminhável"], ["Estacionamento e trânsito"], ["Rua Coberta", "Palácio dos Festivais"], "2026-03-06", "Viajante anônimo 12"),

    _report("rel-foz-01", "foz-do-iguacu-pr", "casal", 4, 4100, 650, 480, 1500, 820, 4.9, "Reservamos um dia para as cataratas e outro para Itaipu e o Marco das Três Fronteiras.", ["Cataratas", "Passeios organizados", "Diversidade"], ["Atrações distantes"], ["Cataratas do Iguaçu", "Itaipu Binacional", "Marco das Três Fronteiras"], "2026-04-08", "Viajante anônimo 13"),
    _report("rel-foz-02", "foz-do-iguacu-pr", "família", 5, 5800, 940, 620, 2000, 1070, 4.8, "O Parque das Aves e as cataratas funcionaram muito bem para adultos e crianças.", ["Natureza", "Estrutura turística", "Atividades familiares"], ["Caminhadas e calor"], ["Parque das Aves", "Cataratas do Iguaçu"], "2026-02-27", "Viajante anônimo 14"),
    _report("rel-foz-03", "foz-do-iguacu-pr", "solo", 3, 2600, 460, 330, 880, 540, 4.6, "Usei ônibus e transfer para as atrações principais e mantive o roteiro dentro do Brasil.", ["Boa sinalização", "Natureza", "Custo controlável"], ["Tempo de deslocamento"], ["Cataratas do Iguaçu", "Templo Budista Chen Tien"], "2026-01-30", "Viajante anônimo 15"),

    _report("rel-bon-01", "bonito-ms", "casal", 5, 6500, 820, 750, 1900, 2250, 4.9, "Agendamos as flutuações antes da viagem e usamos transfer compartilhado para reduzir custos.", ["Água transparente", "Organização ambiental", "Guias"], ["Passeios caros"], ["Rio Sucuri", "Gruta do Lago Azul", "Estância Mimosa"], "2026-05-04", "Viajante anônimo 16"),
    _report("rel-bon-02", "bonito-ms", "família", 6, 8200, 1050, 980, 2500, 2750, 4.8, "Escolhemos atividades com níveis diferentes e deixamos um dia mais leve no balneário.", ["Ecoturismo", "Segurança nas atividades", "Contato com natureza"], ["Necessidade de reservas"], ["Balneário Municipal", "Buraco das Araras", "Rio Sucuri"], "2026-04-14", "Viajante anônimo 17"),
    _report("rel-bon-03", "bonito-ms", "aventura", 4, 5000, 650, 620, 1250, 1950, 4.7, "Priorizamos trilhas e flutuação; o transporte entre os atrativos exigiu planejamento.", ["Aventura", "Paisagens", "Controle de visitantes"], ["Pouca flexibilidade sem reserva"], ["Estância Mimosa", "Rio Sucuri", "Gruta do Lago Azul"], "2026-03-03", "Viajante anônimo 18"),
]

REPORTS_BY_DESTINATION = {}
for report in MOCK_REPORTS:
    REPORTS_BY_DESTINATION.setdefault(report["destination_id"], []).append(report)
