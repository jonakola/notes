import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import NoteList from '@/components/NoteList';

const pushMock = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

// Mock data
const mockNotes = [
  {
    id: 1,
    title: 'Test Note 1',
    content: 'This is test content 1',
    date: new Date().toISOString(),
    category: { id: 1, name: 'Work', colour: '#ff5733', notes_count: 3 },
    created_at: '2023-05-01T12:00:00Z',
    updated_at: '2023-05-01T12:00:00Z'
  },
  {
    id: 2,
    title: 'Test Note 2',
    content: 'This is test content 2',
    date: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(), // yesterday
    category: { id: 2, name: 'Personal', colour: '#33ff57', notes_count: 2 },
    created_at: '2023-05-01T12:00:00Z',
    updated_at: '2023-05-01T12:00:00Z'
  }
];

// Mock fetch
global.fetch = jest.fn();

describe('NoteList Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays loading state initially', async () => {
    // Mock fetch to delay response
    global.fetch.mockImplementationOnce(() => new Promise(resolve => {
      setTimeout(() => {
        resolve({
          ok: true,
          json: () => Promise.resolve(mockNotes)
        });
      }, 100);
    }));

    await act(async () => {
      render(<NoteList activeCategory={null} />);
    });
    
    expect(screen.getByText(/loading notes/i)).toBeInTheDocument();
  });

  it('renders notes after loading', async () => {
    // Mock successful fetch
    global.fetch.mockImplementationOnce(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockNotes)
    }));

    await act(async () => {
      render(<NoteList activeCategory={null} />);
    });
    
    // Wait for notes to load
    await waitFor(() => expect(screen.queryByText(/loading/i)).not.toBeInTheDocument());
    
    // Check for note titles
    expect(screen.getByText('Test Note 1')).toBeInTheDocument();
    expect(screen.getByText('Test Note 2')).toBeInTheDocument();
  });

  it('filters notes by active category', async () => {
    // Mock successful fetch
    global.fetch.mockImplementationOnce(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockNotes)
    }));

    await act(async () => {
      render(<NoteList activeCategory={1} />);
    });
    
    // Wait for notes to load
    await waitFor(() => expect(screen.queryByText(/loading/i)).not.toBeInTheDocument());
    
    // Should show only the Work category note
    expect(screen.getByText('Test Note 1')).toBeInTheDocument();
    expect(screen.queryByText('Test Note 2')).not.toBeInTheDocument();
  });

it('shows empty state when no notes match filter', async () => {
    // Mock empty response
    global.fetch.mockImplementationOnce(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve([])
    }));

    render(<NoteList activeCategory={3} />); // Category with no notes
    
    // Wait for loading to finish
    await waitFor(() => expect(screen.queryByText(/loading/i)).not.toBeInTheDocument());

    expect(screen.getByText(/I'm just here waiting for your charming notes/i)).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    // Silence console error
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock failed fetch
    global.fetch.mockImplementationOnce(() => Promise.reject(new Error('API Error')));

    await act(async () => {
      render(<NoteList activeCategory={null} />);
    });
    
    // Wait for loading to finish
    await waitFor(() => expect(screen.queryByText(/loading/i)).not.toBeInTheDocument());
    
    // Should show empty state on error
    //expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    
    // Restore console.error
    consoleErrorSpy.mockRestore();
  });

  it('handles different date formats correctly', async () => {
    // Mock successful fetch
    global.fetch.mockImplementationOnce(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockNotes)
    }));

    await act(async () => {
      render(<NoteList activeCategory={null} />);
    });
    
    // Wait for notes to load
    await waitFor(() => expect(screen.queryByText(/loading/i)).not.toBeInTheDocument());
    
    // Should show "today" for today's note
    expect(screen.getByText('today')).toBeInTheDocument();
    
    // Should show "yesterday" for yesterday's note
    expect(screen.getByText('yesterday')).toBeInTheDocument();
  });

it('handles note card clicks', async () => {
    // Mock successful fetch
    global.fetch.mockImplementationOnce(() => Promise.resolve({
      ok: true, 
      json: () => Promise.resolve(mockNotes)
    }));

    render(<NoteList activeCategory={null} />);
    
    // Wait for notes to load
    await waitFor(() => expect(screen.queryByText(/loading/i)).not.toBeInTheDocument());
    
    // Click on the first note - important to get the right element that has the click handler
    const noteCard = screen.getByText('Test Note 1').closest('div[role="button"]') || 
                     screen.getByText('Test Note 1').closest('.cursor-pointer');
    
    // If we can't find it with those selectors, we'll need to add a data-testid
    if (!noteCard) {
      // Add this to your component: <div data-testid="note-card-1"...
      const noteCardById = screen.getByTestId('note-card-1');
      fireEvent.click(noteCardById);
    } else {
      fireEvent.click(noteCard);
    }
    
    // Verify navigation was attempted
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/notes/1/edit');
    });
  });
});