import os
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.http import HttpResponse

def serve_react(request):
    """
    Serve the built index.html from React frontend dist.
    Prevents TemplateDoesNotExist errors on Render.
    """
    possible_paths = [
        settings.BASE_DIR.parent / 'frontend' / 'dist' / 'index.html',
        settings.BASE_DIR / 'frontend' / 'dist' / 'index.html',
        os.path.join(settings.BASE_DIR, '../frontend/dist/index.html'),
        os.path.join(settings.BASE_DIR, 'frontend/dist/index.html'),
    ]
    
    for page_path in possible_paths:
        if os.path.exists(page_path):
            with open(page_path, 'r', encoding='utf-8') as f:
                return HttpResponse(f.read(), content_type='text/html')
                
    return HttpResponse(
        "<h2>Spotter AI - React App Build Not Found</h2>"
        "<p>Please ensure 'npm run build' has been executed in the frontend directory.</p>",
        status=404
    )

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('core.urls')),
    re_path(r'^.*$', serve_react, name='react_spa'),
]
