from django.contrib import admin
from .models import Category, Note


# Register your models here.
@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'colour', 'created_at', 'updated_at')
    search_fields = ('name',)
    readonly_fields = ('created_at', 'updated_at')

@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ('title', 'date', 'category', 'created_at')
    list_filter = ('category', 'date')
    search_fields = ('title', 'content')