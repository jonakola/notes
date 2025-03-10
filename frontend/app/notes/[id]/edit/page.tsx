'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Note, Category } from '@/types';
import CustomCategorySelect from '@/components/CustomCategorySelect';

export default function EditNotePage() {
  const router = useRouter();
  const params = useParams();
  const noteId = params.id as string;
  
  const [initialLoading, setInitialLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [note, setNote] = useState<Note | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Get the selected category object
  const selectedCategory = categories.find(cat => cat.id === categoryId);
  const categoryColor = selectedCategory?.colour || '#F8D3B9';
  
  // Fetch the note data
  useEffect(() => {
    const fetchNote = async () => {
      try {
        const response = await fetch(`/api/notes/${noteId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch note');
        }
        const data = await response.json();
        setNote(data);
        setTitle(data.title);
        setContent(data.content);
        setCategoryId(data.category?.id || null);
      } catch (err) {
        setError('Failed to load note data. Please try again later.');
        console.error(err);
      }
    };
    
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        const data = await response.json();
        setCategories(data);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    
    // Run both fetch operations in parallel
    Promise.all([fetchNote(), fetchCategories()])
      .finally(() => setInitialLoading(false));
  }, [noteId]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    
    if (!categoryId) {
      setError('Please select a category');
      return;
    }
    
    try {
      setError(null);
      setIsSaving(true);
      
      const updateData = {
        id: Number(noteId),
        title,
        content,
        date: note?.date || new Date().toISOString().split('T')[0],
        category_id: categoryId
      };
      
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update note');
      }
      
      // Redirect back to dashboard after successful update
      router.push('/dashboard');
      router.refresh(); // Refresh to get updated data
    } catch (err) {
      setError('Failed to update note. Please try again.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleCancel = () => {
    router.push('/dashboard');
  };
  
  const formatDate = () => {
    const date = note?.updated_at ? new Date(note.updated_at) : new Date();
    const options: Intl.DateTimeFormatOptions = { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };
    return date.toLocaleDateString('en-US', options);
  };
  
  if (initialLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-semibold text-brown-dark mb-6">Loading note...</h1>
        </div>
      </div>
    );
  }
  
  if (error && !note) {
    return (
      <div className="container mx-auto p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p>{error}</p>
            <button 
              onClick={() => router.push('/dashboard')}
              className="mt-4 bg-brown text-white py-2 px-4 rounded hover:bg-brown-dark"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4 md:p-6 flex flex-col h-screen max-w-4xl">
      <div className="max-w-3xl mx-auto w-full">
        {/* Close button with tooltip */}
        <div className="flex justify-end mb-4">
          <div className="relative group">
            <button 
              onClick={handleCancel} 
              className="text-2xl text-gray-700 hover:text-gray-900 cursor-pointer"
              aria-label="Close"
            >
              ×
            </button>
            <div className="absolute right-0 mt-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              Close without saving
            </div>
          </div>
        </div>

        {/* Custom Category selector with reduced width */}
        <div className="w-60">
          <CustomCategorySelect 
            categories={categories} 
            selectedId={categoryId} 
            onChange={(id) => setCategoryId(id)} 
          />
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {/* Note card with dynamic color */}
        <div 
          className="rounded-lg p-8 shadow-md mb-6 flex-1"
          style={{ backgroundColor: categoryColor }}
        >
          {/* Last edited date */}
          <div className="text-right text-sm mb-4 text-gray-700">
            Last Edited: {formatDate()}
          </div>
          
          {/* Note title */}
          <div className="mb-4">
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-2xl font-bold bg-transparent border-none focus:outline-none focus:ring-0"
              placeholder="Note Title"
              required
            />
          </div>
          
          {/* Note content */}
          <div>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-transparent border-none focus:outline-none focus:ring-0 resize-none min-h-[500px]"
              placeholder="Pour your heart out..."
              rows={8}
            />
          </div>
        </div>
        
        {/* Save button with tooltip */}
        <div className="flex justify-end">
          <div className="relative group">
            <button
              onClick={handleSubmit}
              disabled={isSaving}
              className="px-4 py-2 border rounded bg-[#8B7E74] text-white hover:bg-[#6c635c] transition-colors duration-200 cursor-pointer"
              aria-label="Save note"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <div className="absolute bottom-full mb-1 right-0 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              {isSaving ? 'Saving your note...' : 'Save changes'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}