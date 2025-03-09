from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Category, Note

class CategorySerializer(serializers.ModelSerializer):
    notes_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'colour', 'notes_count', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at', 'notes_count']

    def validate_colour(self, value):
        """Ensure colour is a valid hex color code"""
        import re
        if not re.match(r'^#(?:[0-9a-fA-F]{3}){1,2}$', value):
            raise serializers.ValidationError(
                f"{value} is not a valid hex color code. Format should be #RRGGBB or #RGB."
            )
        return value

class CategoryNestedSerializer(serializers.ModelSerializer):
    """Simplified category serializer for nesting in Note responses"""
    class Meta:
        model = Category
        fields = ['id', 'name', 'colour']

class NoteSerializer(serializers.ModelSerializer):
    category = CategoryNestedSerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        write_only=True,
        source='category',
        queryset=Category.objects.all(),
    )
    
    class Meta:
        model = Note
        fields = ['id', 'title', 'content', 'date', 'category', 'category_id', 'created_at', 'updated_at']
        extra_kwargs = {
            'created_at': {'read_only': True},
            'updated_at': {'read_only': True},
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        user = self.context.get('request').user if self.context.get('request') else None
        if user and not user.is_anonymous:
            self.fields['category_id'].queryset = Category.objects.filter(user=user)

class SimpleEmailRegistrationSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name="Anonymous",
            last_name="User"
        )
        return user

class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = get_user_model().USERNAME_FIELD
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['email'] = serializers.CharField(required=True)
        self.fields['password'] = serializers.CharField(required=True, style={'input_type': 'password'})
        if 'username' in self.fields:
            del self.fields['username']

    def validate(self, attrs):
        try:
            user = User.objects.get(email=attrs['email'])
        except User.DoesNotExist:
            raise serializers.ValidationError({"email": "No user found with this email address"})
            
        # Use the username for token generation
        attrs['username'] = user.username
        return super().validate(attrs)