"""Orquestrador único de modelo, seleção de tools e resposta estruturada."""

import json
import logging
import re
import time
from typing import Any, Dict, List, Sequence, Tuple
from uuid import uuid4

from pydantic import ValidationError

from app.core.config import Settings, get_settings
from app.prompts.travel_prompts import OLLAMA_CHAT_SYSTEM_PROMPT, OLLAMA_TRIP_PLANNER_SYSTEM_PROMPT
from app.schemas.ai import AIResponse, ToolUsed
from app.services.llm_provider import InvalidProviderResponseError, ProviderError, get_chat_completion_provider
from app.tools.travel_tools import compact_result, execute_tool, get_tool_schemas

logger = logging.getLogger("viajareal.ai")


class AIServiceError(RuntimeError):
    """Falha pública e segura da camada de IA."""


class AIService:
    def __init__(self, settings: Settings | None = None):
        self.settings = settings or get_settings()

    def generate(
        self,
        *,
        feature: str,
        messages: List[Dict[str, Any]],
        payload: Dict[str, Any],
        allowed_tools: Sequence[str],
        mock_tool_plan: Sequence[Tuple[str, Dict[str, Any]]],
    ) -> AIResponse:
        request_id = uuid4().hex
        started = time.monotonic()
        logger.info("ai_request_started request_id=%s feature=%s mode=%s", request_id, feature, self.settings.ai_mode)
        try:
            if self.settings.ai_mode == "mock":
                content, used = self._run_mock(feature, payload, mock_tool_plan)
            else:
                trusted_arguments = {name: arguments for name, arguments in mock_tool_plan}
                provider_messages = messages
                if self.settings.ai_provider == "ollama" and feature == "chat":
                    provider_messages = self._ollama_chat_messages(payload)
                content, used, results = self._run_real(
                    provider_messages,
                    allowed_tools,
                    trusted_arguments,
                    stop_after_tools=self.settings.ai_provider == "ollama" and feature == "chat",
                )
                if results and self.settings.ai_provider == "ollama" and feature == "chat":
                    content = self._build_mock_content(feature, payload, results)
            response = AIResponse(
                request_id=request_id,
                feature=feature,
                message=content["message"],
                data=content.get("data") or {},
                tools_used=used,
                mode=self.settings.ai_mode,
            )
            logger.info(
                "ai_request_completed request_id=%s feature=%s tools=%s duration_ms=%d",
                request_id,
                feature,
                [tool.name for tool in used],
                int((time.monotonic() - started) * 1000),
            )
            return response
        except (ProviderError, ValidationError, ValueError, KeyError, TypeError) as exc:
            logger.warning(
                "ai_request_failed request_id=%s feature=%s error_type=%s duration_ms=%d",
                request_id,
                feature,
                type(exc).__name__,
                int((time.monotonic() - started) * 1000),
            )
            if isinstance(exc, ProviderError) and self.settings.ai_provider == "ollama" and feature == "chat":
                # O chatbot continua útil quando o modelo local está iniciando,
                # excede o timeout ou devolve JSON inválido. As tools continuam
                # sendo executadas pelo backend com argumentos já validados.
                fallback_results, fallback_used = self._execute_tool_plan(mock_tool_plan)
                fallback_content = self._build_mock_content(feature, payload, fallback_results)
                fallback_data = dict(fallback_content.get("data") or {})
                fallback_data["provider_fallback"] = True
                logger.warning(
                    "ai_local_provider_fallback request_id=%s feature=%s tools=%s",
                    request_id,
                    feature,
                    [tool.name for tool in fallback_used],
                )
                return AIResponse(
                    request_id=request_id,
                    feature=feature,
                    message=fallback_content["message"],
                    data=fallback_data,
                    tools_used=fallback_used,
                    mode=self.settings.ai_mode,
                )
            if isinstance(exc, ProviderError):
                raise AIServiceError(str(exc)) from exc
            raise AIServiceError("A camada de IA retornou uma resposta inválida.") from exc

    @staticmethod
    def _ollama_chat_messages(payload: Dict[str, Any]) -> List[Dict[str, str]]:
        """Prompt compacto para modelos locais pequenos, mantendo o contrato público."""
        return [
            {
                "role": "system",
                "content": OLLAMA_CHAT_SYSTEM_PROMPT,
            },
            {
                "role": "user",
                "content": json.dumps({"user_data": payload}, ensure_ascii=False, default=str),
            },
        ]

    def generate_grounded(
        self,
        *,
        feature: str,
        messages: List[Dict[str, Any]],
        payload: Dict[str, Any],
        required_tool_plan: Sequence[Tuple[str, Dict[str, Any]]],
    ) -> AIResponse:
        """Executa tools obrigatórias no orquestrador e sintetiza somente com seus resultados."""
        request_id = uuid4().hex
        started = time.monotonic()
        logger.info("ai_grounded_request_started request_id=%s feature=%s mode=%s", request_id, feature, self.settings.ai_mode)
        try:
            results, used = self._execute_tool_plan(required_tool_plan)
            grounded_content = self._build_mock_content(feature, payload, results)
            content = grounded_content
            planning_data = (grounded_content.get("data") or {}).get("planning") or {}
            skip_synthesis = bool(planning_data.get("insufficient_data"))
            if self.settings.ai_mode == "real" and not skip_synthesis:
                grounding_message = {
                    "role": "user",
                    "content": json.dumps(
                        {
                            "content_type": "untrusted_tool_results",
                            "data": results,
                        },
                        ensure_ascii=False,
                        default=str,
                    ),
                }
                provider = get_chat_completion_provider(self.settings)
                provider_messages = [*messages, grounding_message]
                if self.settings.ai_provider == "ollama" and feature == "trip_planner":
                    provider_messages = [
                        {
                            "role": "system",
                            "content": OLLAMA_TRIP_PLANNER_SYSTEM_PROMPT,
                        },
                        {
                            "role": "user",
                            "content": json.dumps(
                                {"trip_request": payload, "content_type": "untrusted_tool_results", "tool_results": results},
                                ensure_ascii=False,
                                default=str,
                            ),
                        },
                    ]
                try:
                    candidate = self._parse_structured_content(provider.complete(provider_messages, None).content)
                    candidate_planning = (candidate.get("data") or {}).get("planning")
                except InvalidProviderResponseError:
                    candidate = None
                    candidate_planning = None
                if self._valid_detailed_planning(candidate_planning):
                    content["message"] = candidate["message"]
                    content["data"]["planning"]["summary"] = candidate_planning["summary"]
                    content["data"]["planning"]["profile_fit"] = candidate_planning["profile_fit"]
                else:
                    logger.warning("ai_grounded_schema_fallback request_id=%s feature=%s", request_id, feature)
            response = AIResponse(
                request_id=request_id,
                feature=feature,
                message=content["message"],
                data=content.get("data") or {},
                tools_used=used,
                mode=self.settings.ai_mode,
            )
            logger.info(
                "ai_grounded_request_completed request_id=%s feature=%s tools=%s duration_ms=%d",
                request_id,
                feature,
                [tool.name for tool in used],
                int((time.monotonic() - started) * 1000),
            )
            return response
        except (ProviderError, ValidationError, ValueError, KeyError, TypeError) as exc:
            logger.warning(
                "ai_grounded_request_failed request_id=%s feature=%s error_type=%s duration_ms=%d",
                request_id,
                feature,
                type(exc).__name__,
                int((time.monotonic() - started) * 1000),
            )
            if isinstance(exc, ProviderError):
                raise AIServiceError(str(exc)) from exc
            raise AIServiceError("Não foi possível estruturar o planejamento com IA.") from exc

    def synthesize_structured_data(
        self,
        *,
        feature: str,
        messages: List[Dict[str, Any]],
        fallback_data: Dict[str, Any],
        required_fields: Dict[str, type],
    ) -> Dict[str, Any]:
        """Usa a LLM apenas para síntese de dados previamente calculados no backend."""
        request_id = uuid4().hex
        started = time.monotonic()
        logger.info("ai_synthesis_started request_id=%s feature=%s mode=%s", request_id, feature, self.settings.ai_mode)
        if self.settings.ai_mode == "mock":
            return dict(fallback_data)
        try:
            provider = get_chat_completion_provider(self.settings)
            try:
                content = self._parse_structured_content(provider.complete(messages, None).content)
                candidate = content.get("data") or {}
            except InvalidProviderResponseError:
                candidate = {}
            if not all(isinstance(candidate.get(field), expected) for field, expected in required_fields.items()):
                logger.warning("ai_synthesis_schema_fallback request_id=%s feature=%s", request_id, feature)
                return dict(fallback_data)
            result = dict(fallback_data)
            result.update({field: candidate[field] for field in required_fields})
            logger.info(
                "ai_synthesis_completed request_id=%s feature=%s duration_ms=%d",
                request_id,
                feature,
                int((time.monotonic() - started) * 1000),
            )
            return result
        except ProviderError as exc:
            logger.warning("ai_synthesis_failed request_id=%s feature=%s error_type=%s", request_id, feature, type(exc).__name__)
            raise AIServiceError(str(exc)) from exc

    @staticmethod
    def _valid_detailed_planning(planning: Any) -> bool:
        return (
            isinstance(planning, dict)
            and isinstance(planning.get("summary"), str)
            and bool(planning["summary"].strip())
            and isinstance(planning.get("profile_fit"), str)
            and bool(planning["profile_fit"].strip())
        )

    def _execute_tool_plan(
        self,
        tool_plan: Sequence[Tuple[str, Dict[str, Any]]],
    ) -> Tuple[Dict[str, Dict[str, Any]], List[ToolUsed]]:
        results: Dict[str, Dict[str, Any]] = {}
        used: List[ToolUsed] = []
        for name, arguments in tool_plan:
            result = execute_tool(name, arguments)
            results[name] = result
            used.append(ToolUsed(name=name, arguments=arguments, result_summary=compact_result(result)))
        return results, used

    def execute_required_tools(
        self,
        tool_plan: Sequence[Tuple[str, Dict[str, Any]]],
    ) -> Tuple[Dict[str, Dict[str, Any]], List[ToolUsed]]:
        """Ponto público para services executarem uma sequência obrigatória de tools."""
        return self._execute_tool_plan(tool_plan)

    def _run_mock(
        self,
        feature: str,
        payload: Dict[str, Any],
        tool_plan: Sequence[Tuple[str, Dict[str, Any]]],
    ) -> Tuple[Dict[str, Any], List[ToolUsed]]:
        results, used = self._execute_tool_plan(tool_plan)
        return self._build_mock_content(feature, payload, results), used

    def _run_real(
        self,
        messages: List[Dict[str, Any]],
        allowed_tools: Sequence[str],
        trusted_arguments: Dict[str, Dict[str, Any]] | None = None,
        stop_after_tools: bool = False,
    ) -> Tuple[Dict[str, Any], List[ToolUsed], Dict[str, Dict[str, Any]]]:
        provider = get_chat_completion_provider(self.settings)
        schemas = get_tool_schemas(allowed_tools)
        conversation = list(messages)
        used: List[ToolUsed] = []
        results: Dict[str, Dict[str, Any]] = {}
        available_schemas = schemas

        for _ in range(self.settings.ai_max_tool_cycles + 1):
            response = provider.complete(conversation, available_schemas)
            if not response.tool_calls:
                return self._parse_structured_content(response.content), used, results

            conversation.append(response.raw_message)
            for call in response.tool_calls:
                try:
                    name = call["function"]["name"]
                    if name not in allowed_tools:
                        raise ValueError(f"Tool não autorizada para este caso de uso: {name}")
                    model_arguments = json.loads(call["function"].get("arguments") or "{}")
                    arguments = (trusted_arguments or {}).get(name, model_arguments)
                    result = execute_tool(name, arguments)
                    results[name] = result
                except (KeyError, TypeError, json.JSONDecodeError) as exc:
                    raise InvalidProviderResponseError("Tool call inválida retornada pelo provedor.") from exc
                used.append(ToolUsed(name=name, arguments=arguments, result_summary=compact_result(result)))
                conversation.append(
                    {
                        "role": "tool",
                        "tool_call_id": call.get("id", name),
                        "content": json.dumps(
                            {"content_type": "untrusted_tool_result", "data": result},
                            ensure_ascii=False,
                            default=str,
                        ),
                    }
                )
            if stop_after_tools:
                return {}, used, results
            # A Groq não combina JSON mode e tool calling na mesma requisição.
            # Após executar as tools selecionadas, a próxima chamada apenas estrutura a resposta final.
            available_schemas = None

        raise InvalidProviderResponseError("O provedor excedeu o limite de ciclos de tools.")

    @staticmethod
    def _parse_structured_content(content: str | None) -> Dict[str, Any]:
        if not content:
            raise InvalidProviderResponseError("O provedor retornou conteúdo vazio.")
        cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", content.strip(), flags=re.IGNORECASE)
        try:
            parsed = json.loads(cleaned)
        except json.JSONDecodeError as exc:
            raise InvalidProviderResponseError("O conteúdo do provedor não é JSON válido.") from exc
        if not isinstance(parsed, dict):
            raise InvalidProviderResponseError("O conteúdo do provedor não é um objeto JSON.")
        if isinstance(parsed.get("answer"), str):
            required_types = {
                "type": str,
                "tools_used": list,
                "suggestions": list,
                "data": dict,
                "limitations": list,
            }
            if any(not isinstance(parsed.get(field), expected) for field, expected in required_types.items()):
                raise InvalidProviderResponseError("A resposta não segue o schema do assistente de viagens.")
            normalized_data = dict(parsed["data"])
            normalized_data["response_metadata"] = {
                "type": parsed["type"],
                "suggestions": parsed["suggestions"][:3],
                "limitations": parsed["limitations"],
            }
            return {"message": parsed["answer"], "data": normalized_data}
        if isinstance(parsed.get("message"), str) and isinstance(parsed.get("data", {}), dict):
            return parsed
        raise InvalidProviderResponseError("A resposta não possui answer/data no formato esperado.")

    @staticmethod
    def _build_mock_content(feature: str, payload: Dict[str, Any], results: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
        def data_for(name: str) -> Dict[str, Any]:
            result = results.get(name) or {}
            return result.get("data") or {} if result.get("ok") else {}

        def first_error() -> Dict[str, Any] | None:
            return next((result.get("error") for result in results.values() if result.get("ok") is False), None)

        info_data = data_for("get_destination_information")
        destination_info = info_data.get("destination") or {}
        reports_data = data_for("search_destination_reports")
        error = first_error()

        if feature == "trip_planner":
            base = data_for("generate_itinerary_base")
            budget = data_for("calculate_trip_budget")
            live_context = data_for("get_live_destination_context")
            if error or not base or not budget:
                message = (error or {}).get("message", "Não há dados mockados suficientes para gerar o roteiro.")
                if payload.get("detailed_plan"):
                    limitations = [
                        message,
                        "Não há atrações e relatos internos suficientes para montar um roteiro por dia sem inventar informações.",
                        "A estimativa exibida é apenas a distribuição matemática do orçamento informado pelo usuário; não representa preços de Portugal.",
                        *(live_context.get("limitations") or []),
                    ]
                    return {
                        "message": message,
                        "data": {
                            "itinerary": None,
                            "error": error,
                            "planning": {
                                "summary": f"{payload['destination']} foi localizado, mas ainda não possui dados internos suficientes para gerar um roteiro confiável.",
                                "profile_fit": "Não foi possível avaliar a adequação ao perfil sem atrações e relatos internos do destino.",
                                "estimated_total": 0,
                                "budget_status": "não calculado: faltam dados internos de custos do destino",
                                "positive_points": [],
                                "attention_points": [message],
                                "itinerary": [],
                                "limitations": list(dict.fromkeys(limitations)),
                                "live_context": live_context,
                                "data_sources": {
                                    "location_and_weather": "real_or_labeled_fallback",
                                    "budget": "deterministic_user_budget_distribution",
                                    "reports_and_itinerary": "unavailable",
                                    "summary": "deterministic_backend_fallback",
                                },
                                "insufficient_data": True,
                            },
                        },
                    }
                return {"message": message, "data": {"error": error, "itinerary": None}}
            blocks = []
            for day in base["itinerary"]:
                attraction_names = [attraction["name"] for attraction in day["attractions"]]
                blocks.append(
                    {
                        "period": f"Dia {day['day']}",
                        "city": destination_info.get("city", payload["destination"]),
                        "description": ", ".join(attraction_names) if attraction_names else "Dia livre sem atração compatível nos dados mockados.",
                        "activities": attraction_names,
                    }
                )
            breakdown = budget["breakdown"]
            itinerary = {
                "destination": payload["destination"],
                "days": payload["days"],
                "style": payload["style"],
                "summary": f"Roteiro de {payload['days']} dias em {payload['destination']}, com ritmo {payload['style'].lower()} e margem para descanso.",
                "blocks": blocks,
                "budget": {
                    "lodging": breakdown["accommodation"],
                    "food": breakdown["food"],
                    "transport": breakdown["transport"],
                    "activities": breakdown["activities"],
                    "contingency": breakdown["other"],
                    "total": budget["total"],
                    "per_person": round(budget["total"] / max(payload.get("travelers", 1), 1), 2),
                    "currency": budget["currency"],
                },
                "safety": destination_info.get("safety_rating", "Não verificado"),
                "best_season": destination_info.get("best_season", "Não verificado"),
                "insufficient_data": base["insufficient_data"],
            }
            response_data: Dict[str, Any] = {"itinerary": itinerary}
            if payload.get("detailed_plan"):
                reports = reports_data.get("reports", [])

                def unique_values(key: str, limit: int = 6) -> List[str]:
                    values: List[str] = []
                    for report in reports:
                        for value in report.get(key, []):
                            if value not in values:
                                values.append(value)
                    return values[:limit]

                requested_interests = {str(item).strip().lower() for item in payload.get("interests", [])}
                available_interests = {str(item).strip().lower() for item in destination_info.get("related_interests", [])}
                matched_interests = sorted(requested_interests.intersection(available_interests))
                profile_fit = (
                    f"{len(matched_interests)} de {len(requested_interests)} interesses informados aparecem nos dados do destino: "
                    f"{', '.join(matched_interests)}. Perfil indicado: {destination_info.get('recommended_profile', 'não informado nas tools')}."
                )
                attention_points = list(destination_info.get("attention_points", []))
                for value in unique_values("negatives"):
                    if value not in attention_points:
                        attention_points.append(value)
                response_data["planning"] = {
                    "summary": (
                        f"Planejamento-base de {payload['days']} dias para {destination_info.get('name', payload['destination'])}. "
                        f"{destination_info.get('description', '')}"
                    ).strip(),
                    "profile_fit": profile_fit,
                    "estimated_total": budget["total"],
                    "budget_status": budget["classification"],
                    "positive_points": unique_values("positives"),
                    "attention_points": attention_points[:8],
                    "itinerary": [
                        {
                            "day": item["day"],
                            "activities": [attraction["name"] for attraction in item["attractions"]],
                            "estimated_activities_cost": item["estimated_cost"],
                        }
                        for item in base["itinerary"]
                    ],
                    "limitations": [
                        "Os dados são mockados e não representam preços, disponibilidade ou condições atuais.",
                        base["message"],
                        *(live_context.get("limitations") or []),
                    ],
                    "live_context": live_context,
                    "data_sources": {
                        "location_and_weather": "real_or_labeled_fallback",
                        "reports_destination_budget_itinerary": "mock_or_deterministic",
                        "summary_and_profile_fit": "ai_generated",
                    },
                }
            return {"message": f"Preparei um roteiro estimado para {payload['destination']}. Os dados mockados não representam disponibilidade em tempo real.", "data": response_data}

        if feature == "report_improvement":
            original = (payload.get("original_text") or payload["text"]).strip()
            improved = original[0].upper() + original[1:] if original else original
            if improved and improved[-1] not in ".!?":
                improved += "."
            if payload.get("detailed_improvement"):
                sentences = [sentence.strip() for sentence in re.split(r"(?<=[.!?])\s+|\n+", original) if sentence.strip()]
                positive_terms = ("bom", "boa", "ótimo", "ótima", "gostei", "recomendo", "tranquilo", "seguro")
                negative_terms = ("ruim", "caro", "cara", "difícil", "problema", "lotado", "demorado", "inseguro", "atenção")
                positives = [sentence for sentence in sentences if any(term in sentence.casefold() for term in positive_terms)][:5]
                negatives = [sentence for sentence in sentences if any(term in sentence.casefold() for term in negative_terms)][:5]
                mentioned_places: List[str] = []
                candidates = [destination_info.get("name"), destination_info.get("city")]
                candidates.extend(attraction.get("name") for attraction in destination_info.get("attractions", []))
                for place in candidates:
                    if not place:
                        continue
                    words = place.split()
                    aliases = [place]
                    aliases.extend(
                        " ".join(words[start:end])
                        for start in range(len(words))
                        for end in range(start + 2, len(words) + 1)
                    )
                    matches = [alias for alias in aliases if alias.casefold() in original.casefold()]
                    if matches:
                        best_match = max(matches, key=len)
                        if best_match not in mentioned_places:
                            mentioned_places.append(best_match)
                tag_terms = ("praia", "natureza", "gastronomia", "cultura", "aventura", "história", "família", "casal", "solo")
                suggested_tags = [term for term in tag_terms if term in original.casefold()]
                if payload.get("trip_type") and payload["trip_type"].casefold() not in [tag.casefold() for tag in suggested_tags]:
                    suggested_tags.append(payload["trip_type"])
                missing = []
                if not payload.get("trip_type"):
                    missing.append("tipo de viagem")
                if not payload.get("expenses_provided"):
                    missing.append("gastos detalhados")
                if not payload.get("rating_provided"):
                    missing.append("avaliação do usuário")
                if not mentioned_places:
                    missing.append("lugares visitados no texto")
                return {
                    "message": "O relato foi organizado sem substituir o texto original.",
                    "data": {
                        "improved_text": improved,
                        "summary": (sentences[0] if sentences else original)[:400],
                        "positive_points": positives,
                        "negative_points": negatives,
                        "mentioned_places": mentioned_places,
                        "suggested_tags": suggested_tags,
                        "missing_information": missing,
                        "limitations": ["A IA organiza o texto, mas não verifica a veracidade do relato."],
                    },
                }
            return {"message": "O relato foi revisado sem acrescentar fatos.", "data": {"improved_text": improved, "improvement_notes": ["Clareza e pontuação revisadas", "Fatos originais preservados"]}}

        if feature == "report_summary":
            supplied = payload.get("reports") or reports_data.get("reports", [])
            texts = [item.get("text") or item.get("story_summary") for item in supplied if item.get("text") or item.get("story_summary")]
            summary = f"Foram analisados {len(supplied)} relatos sobre {payload['destination']}."
            return {"message": summary, "data": {"summary": summary, "positives": texts[:3] or ["Ainda não há relatos suficientes"], "attention_points": ["Valores e percepções podem variar por época e perfil"]}}

        if feature == "destination_summary":
            return {
                "message": (error or {}).get("message") or f"Resumo de {payload['destination']} gerado com dados mockados e não verificados.",
                "data": {
                    "summary": destination_info.get("description", (error or {}).get("message", "Dados insuficientes.")),
                    "highlights": [attraction["name"] for attraction in destination_info.get("attractions", [])[:4]],
                    "attention_points": destination_info.get("attention_points", []),
                    "safety": destination_info.get("safety_rating", "Não verificado"),
                    "best_season": destination_info.get("best_season", "Não verificado"),
                    "average_cost": destination_info.get("average_daily_cost", "Não verificado"),
                    "report_count": reports_data.get("found_count", 0),
                    "error": error,
                },
            }

        if feature == "chat":
            intent = payload.get("intent", "general")
            missing = payload.get("missing_information")
            if missing:
                questions = {
                    "destination": "Qual destino você quer consultar?",
                    "days": "Quantos dias terá a viagem?",
                    "available_budget": "Qual é o orçamento disponível para a viagem?",
                    "accommodation": "Quanto você pretende gastar com hospedagem?",
                    "food": "Quanto você pretende gastar com alimentação?",
                    "transport": "Quanto você pretende gastar com transporte?",
                    "activities": "Quanto você pretende gastar com passeios e atividades?",
                    "other": "Quanto deseja reservar para outros gastos?",
                    "budget": "Qual é o seu orçamento diário para a comparação?",
                    "first_destination": "Qual é o primeiro destino da comparação?",
                    "second_destination": "Qual é o segundo destino da comparação?",
                    "report_text": "Qual texto do relato você quer melhorar?",
                }
                return {
                    "message": questions.get(missing, f"Qual valor você deseja informar para {missing}?"),
                    "data": {"missing_information": missing},
                }
            if intent == "report_improvement":
                original = str((payload.get("context") or {}).get("form_data", {}).get("report_text", "")).strip()
                improved = original[:1].upper() + original[1:] if original else original
                if improved and improved[-1] not in ".!?":
                    improved += "."
                return {
                    "message": "Revisei o relato sem acrescentar fatos novos.",
                    "data": {"improved_text": improved, "improvement_notes": ["Pontuação revisada", "Conteúdo original preservado"]},
                }
            comparison = data_for("compare_destinations_data")
            budget = data_for("calculate_trip_budget")
            base = data_for("generate_itinerary_base")
            live = data_for("get_live_destination_context")
            if error:
                return {"message": error["message"], "data": {"error": error}}
            if comparison:
                message = "Comparei os destinos usando custos, segurança, clima e perfil disponíveis nos dados mockados."
                data = {"comparison": comparison}
            elif budget:
                message = f"O total calculado é de R$ {budget['total']:,.2f}, classificado como {budget['classification']}."
                data = {"budget": budget}
            elif base:
                message = f"Montei uma base de roteiro de {base['days']} dias para {base['destination']['name']}."
                data = {"itinerary_base": base, "live_context": live}
            elif live:
                weather = live.get("weather") or {}
                current = weather.get("current") or {}
                location = live.get("location") or {}
                if current:
                    message = f"Em {location.get('city') or live.get('destination')}, a temperatura consultada é {current.get('temperature_c')} °C, com {current.get('condition')}."
                else:
                    message = "Não há clima real disponível para esta consulta; veja as limitações retornadas pela tool."
                data = {"live_context": live}
            elif intent == "reports":
                message = f"Encontrei {reports_data.get('found_count', 0)} relatos para a análise solicitada."
                data = {"reports": reports_data.get("reports", []), "reports_found": reports_data.get("found_count", 0)}
            else:
                message = destination_info.get("description") or "Posso ajudar com destinos, roteiros, relatos, comparações e orçamento de viagem."
                data = {"destination": destination_info, "reports_found": reports_data.get("found_count", 0)}
            return {"message": message, "data": data}

        raise ValueError(f"Feature de IA desconhecida: {feature}")
