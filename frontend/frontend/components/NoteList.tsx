'use client';

import { useState, useEffect } from 'react';
import { Note } from '@/types';
import EmptyState from './EmptyState';
import { useRouter } from 'next/navigation';

interface NoteCardProps {
  note: Note;
}

function NoteCard({ note }: NoteCardProps) {
  const router = useRouter();
  
  const handleNoteClick = () => {
    router.push(`/notes/${note.id}/edit`);
  };

  // Get the background color directly from the category
  const getCategoryColor = () => {
    if (!note.category || !note.category.colour) return '#FCDC94';
    return note.category.colour;
  };

  // Format date to display as "today", "yesterday", or "Month Day"
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'yesterday';
    } else {
      // Format as "July 16" or similar
      return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    }
  };
  
  return (
    <div 
      data-testid={`note-card-${note.id}`} 
      role="button"
      className="rounded-lg cursor-pointer overflow-hidden ring-2 hover:ring-4 transition-all duration-200 relative"
      style={{ 
        backgroundColor: getCategoryColor(),
        boxShadow: `0 0 0 2px ${getCategoryColor()}80`,
        '--tw-ring-color': `${getCategoryColor()}80`,
        aspectRatio: '1 / 0.85' 
      } as React.CSSProperties}
      onClick={handleNoteClick}
    >
      <div className="p-4 h-full flex flex-col">
        <div className="flex items-start mb-2 gap-2">
          <span className="text-sm font-bold">{formatDate(note.date)}</span>
          {note.category && (
            <span className="text-sm font-normal">{note.category.name}</span>
          )}
        </div>
        <h3 className="text-xl font-medium mb-2">{note.title}</h3>
        <p className="text-sm line-clamp-3 flex-grow">{note.content}</p>
      </div>
    </div>
  );
}

interface NoteListProps {
  activeCategory: number | null;
}

export default function NoteList({ activeCategory }: NoteListProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const response = await fetch('/api/notes');
        const data = await response.json();
        // Handle the API response format which includes results array
        setNotes(data.results || data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching notes:', error);
        setLoading(false);
      }
    };

    fetchNotes();
  }, []);

  if (loading) {
    return <div className="w-full p-5">Loading notes...</div>;
  }

  // Filter notes based on active category
  const filteredNotes = activeCategory
    ? notes.filter(note => note.category.id === activeCategory)
    : notes;

  if (filteredNotes.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNotes.map((note) => (
        <div key={note.id} data-testid="note-item">
            <NoteCard note={note} />
        </div>
        ))}
      </div>
    </div>
  );
}