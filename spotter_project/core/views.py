from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Trip
from .serializers import TripSerializer

@api_view(['POST'])
def calculate_trip(request):
    data = request.data
    current_location = data.get('current_location')
    pickup_location = data.get('pickup_location')
    dropoff_location = data.get('dropoff_location')
    try:
        cycle_used = float(data.get('current_cycle_used', 0.0))
    except (ValueError, TypeError):
        cycle_used = 0.0
    
    estimated_driving_hours = 8.5 
    total_on_duty = estimated_driving_hours + 2.0 
    
    remaining_hours = 70.0 - (cycle_used + total_on_duty)

    if remaining_hours > 15:
        compliance_level = "Normal"
        compliance_status = "Compliant: Normal operation"
    elif remaining_hours > 0:
        compliance_level = "Warning"
        compliance_status = "Warning: Cycle Limit Approaching"
    else:
        compliance_level = "Action Req"
        compliance_status = "Action Req: 70-hour limit exceeded"

    response_data = {
        "status": "success",
        "trip_details": {
            "current_location": current_location,
            "pickup_location": pickup_location,
            "dropoff_location": dropoff_location,
            "cycle_used_hours": cycle_used
        },
        "calculated_metrics": {
            "estimated_driving_hours": estimated_driving_hours,
            "total_on_duty_hours": total_on_duty,
            "remaining_cycle_hours": remaining_hours,
            "compliance_level": compliance_level,
            "compliance_status": compliance_status
        },
        "eld_logs": [
            {"duty_status": "Off Duty", "hours": 10.0, "location": current_location, "remark": "10-hour mandatory rest"},
            {"duty_status": "On Duty (Not Driving)", "hours": 1.0, "location": pickup_location, "remark": "Pre-trip inspection & Loading"},
            {"duty_status": "Driving", "hours": estimated_driving_hours, "location": "En Route", "remark": "Driving to dropoff"},
            {"duty_status": "On Duty (Not Driving)", "hours": 1.0, "location": dropoff_location, "remark": "Unloading & Post-trip"}
        ]
    }
    return Response(response_data, status=status.HTTP_200_OK)