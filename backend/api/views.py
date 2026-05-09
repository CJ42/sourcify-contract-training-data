import json

from django.http import HttpRequest, HttpResponseBadRequest, JsonResponse
from django.views.decorators.csrf import csrf_exempt

from service import SourcifyServiceError, analyze_contract


@csrf_exempt
def health_view(_request: HttpRequest) -> JsonResponse:
    return JsonResponse({"ok": True, "service": "django-backend"})


@csrf_exempt
def analyze_contract_view(request: HttpRequest) -> JsonResponse:
    if request.method != "POST":
        return HttpResponseBadRequest("POST required")

    try:
        payload = json.loads(request.body.decode("utf-8") or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON payload"}, status=400)

    chain_id = payload.get("chainId")
    address = payload.get("address")
    if not chain_id or not address:
        return JsonResponse({"error": "chainId and address are required"}, status=400)

    try:
        result = analyze_contract(chain_id=chain_id, address=address)
    except SourcifyServiceError as exc:
        return JsonResponse({"error": str(exc)}, status=502)
    except Exception as exc:  # pragma: no cover - defensive API boundary
        return JsonResponse({"error": f"Unexpected backend error: {exc}"}, status=500)

    return JsonResponse(result)
