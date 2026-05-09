import json
import os

from django.http import HttpRequest, HttpResponseNotAllowed, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from service import SourcifyServiceError, analyze_contract

_INTERNAL_GATEWAY_SECRET = os.environ.get("INTERNAL_GATEWAY_SECRET", "")


def _check_gateway_secret(request: HttpRequest) -> bool:
    """Return True if the optional shared-secret guard passes.

    When INTERNAL_GATEWAY_SECRET is set the caller must supply the same value
    in the X-Gateway-Secret header.  If the env-var is empty the check is
    skipped (suitable for local dev).
    """
    if not _INTERNAL_GATEWAY_SECRET:
        return True
    return request.headers.get("X-Gateway-Secret", "") == _INTERNAL_GATEWAY_SECRET


@csrf_exempt
def health_view(_request: HttpRequest) -> JsonResponse:
    return JsonResponse({"ok": True, "service": "django-backend"})


@csrf_exempt
def analyze_contract_view(request: HttpRequest) -> JsonResponse:
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    if not _check_gateway_secret(request):
        return JsonResponse({"error": "Forbidden"}, status=403)

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
    except Exception as exc:  # pragma: no cover
        return JsonResponse({"error": f"Unexpected backend error: {exc}"}, status=500)

    return JsonResponse(result)
