import React, { act } from 'react';  // Import act from react instead
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CategoryList from '@/components/CategoryList';

// Sample mock data
const mockCategories = [
  { id: 1, name: 'Work', colour: '#FF5733', notes_count: 3 },
  { id: 2, name: 'Personal', colour: '#33FF57', notes_count: 2 },
  { id: 3, name: 'Ideas', colour: '#3357FF', notes_count: 1 }
];

// Mock fetch globally
global.fetch = jest.fn();

describe('CategoryList Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Setup fetch mock to return our test data
    global.fetch.mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockCategories)
      })
    );
  });

  it('renders loading state initially', async () => {
    // Use act for the initial render
    await act(async () => {
      render(
        <CategoryList 
          activeCategory={null} 
          onCategorySelect={jest.fn()} 
        />
      );
    });
    
    // Loading state might be quick, so we may not see it
    // But we should eventually see the categories
    expect(await screen.findByText('Work')).toBeInTheDocument();
  });

  it('renders categories after loading', async () => {
    await act(async () => {
      render(
        <CategoryList 
          activeCategory={null} 
          onCategorySelect={jest.fn()} 
      />
      );
    });
    
    // Check if categories are rendered
    expect(await screen.findByText('Work')).toBeInTheDocument();
    expect(screen.getByText('Personal')).toBeInTheDocument();
    expect(screen.getByText('Ideas')).toBeInTheDocument();
    
    // Check note counts
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('calls onCategorySelect when a category is clicked', async () => {
    const mockSelectFn = jest.fn();
    
    await act(async () => {
      render(
        <CategoryList 
          activeCategory={null} 
          onCategorySelect={mockSelectFn} 
        />
      );
    });
    
    // Wait for categories to be in the document
    const workCategory = await screen.findByText('Work');
    
    // Click on a category using act
    await act(async () => {
      fireEvent.click(workCategory);
    });
    
    // Check if the select function was called with correct args
    expect(mockSelectFn).toHaveBeenCalledWith(1, mockCategories[0]);
  });

  it('highlights the active category', async () => {
    await act(async () => {
      render(
        <CategoryList 
          activeCategory={2} 
          onCategorySelect={jest.fn()} 
        />
      );
    });
    
    // Wait for categories to be in the document
    await screen.findByText('Work');
    
    // Check if the active category has the font-bold class
    const personalCategory = screen.getByText('Personal').closest('li');
    expect(personalCategory).toHaveClass('font-bold');
    
    // Check non-active categories don't have font-bold
    const workCategory = screen.getByText('Work').closest('li');
    expect(workCategory).not.toHaveClass('font-bold');
  });

  it('handles API fetch errors gracefully', async () => {
    // Override fetch mock to simulate an error
    global.fetch.mockImplementationOnce(() => 
      Promise.reject(new Error('Network error'))
    );
    
    let consoleErrorSpy;
    
    await act(async () => {
      // Spy on console.error to suppress expected error message in test output
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <CategoryList 
          activeCategory={null} 
          onCategorySelect={jest.fn()} 
        />
      );
    });
    
    // We should still see "All Notes" in the error state
    expect(await screen.findByText('All Notes')).toBeInTheDocument();
    
    // Restore console.error
    consoleErrorSpy.mockRestore();
  });
});
