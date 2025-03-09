from django.shortcuts import render
from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from django.db.models import Count
from .models import Category, Note
from .serializers import CategorySerializer, NoteSerializer, SimpleEmailRegistrationSerializer, EmailTokenObtainPairSerializer
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken


class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Category.objects.filter(user=self.request.user).annotate(
            notes_count=Count('notes')
        ).order_by('name')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class NoteViewSet(viewsets.ModelViewSet):
    serializer_class = NoteSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = Note.objects.filter(user=self.request.user)
        category_id = self.request.query_params.get('category', None)
        
        if category_id is not None:
            queryset = queryset.filter(category_id=category_id)
            
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class SimpleEmailRegistrationView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = SimpleEmailRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Create default categories for the new user
            default_categories = [
                {"name": "Random Thoughts", "colour": "#EF9C66"},
                {"name": "School", "colour": "#FCDC94"},
                {"name": "Personal", "colour": "#78ABA8"},
            ]
            
            for category_data in default_categories:
                Category.objects.create(
                    user=user,
                    name=category_data["name"],
                    colour=category_data["colour"]
                )
            
            # Generate token for the newly registered user
            refresh = RefreshToken.for_user(user)
            
            return Response({
                "message": "User registered successfully",
                "email": user.email,
                "tokens": {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token)
                }
            }, status=status.HTTP_201_CREATED)

        print(serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class EmailTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer