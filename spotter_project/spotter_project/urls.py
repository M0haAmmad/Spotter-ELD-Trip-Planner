from django.contrib import admin
from django.urls import path
from core.views import calculate_trip

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/calculate-trip/', calculate_trip, name='calculate_trip'),
]
