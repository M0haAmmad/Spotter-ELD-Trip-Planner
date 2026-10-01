from rest_framework import serializers
# pyrefly: ignore [missing-import]
from .models import Trip

class TripSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trip
        fields = '__all__'