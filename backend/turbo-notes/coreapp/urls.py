from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet, 
    NoteViewSet, 
    SimpleEmailRegistrationView, 
    EmailTokenObtainPairView
)
from rest_framework_simplejwt.views import TokenRefreshView

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'notes', NoteViewSet, basename="note")

urlpatterns = [
    path('register/', SimpleEmailRegistrationView.as_view(), name='register'),
    path('token/', EmailTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('', include(router.urls)),
]