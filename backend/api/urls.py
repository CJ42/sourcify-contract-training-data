from django.urls import path

from .views import analyze_contract_view, health_view

urlpatterns = [
    path("health/", health_view, name="health"),
    path("contracts/analyze/", analyze_contract_view, name="analyze-contract"),
]
