from django.db import models
from django.core.validators import RegexValidator
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User
import re

def validate_hex_color(value):
    if not re.match(r'^#(?:[0-9a-fA-F]{3}){1,2}$', value):
        raise ValidationError(
            '%(value)s is not a valid hex color code. Format should be #RRGGBB or #RGB.',
            params={'value': value},
        )

class Category(models.Model):
    name = models.CharField(max_length=100)
    colour = models.CharField(
        max_length=7, 
        validators=[validate_hex_color],
        help_text="Hex color code (e.g. #FFFFFF)"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='categories')
    
    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['name']
    
    def __str__(self):
        return self.name

class Note(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    date = models.DateField()
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='notes')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notes')
    
    class Meta:
        ordering = ['-date']
    
    def __str__(self):
        return self.title