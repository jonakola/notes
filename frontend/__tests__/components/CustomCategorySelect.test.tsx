import React, { act } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CustomCategorySelect from '@/components/CustomCategorySelect';

// Sample mock categories data
const mockCategories = [
  { id: 1, name: 'Work', colour: '#FF5733', notes_count: 3 },
  { id: 2, name: 'Personal', colour: '#33FF57', notes_count: 2 },
  { id: 3, name: 'Ideas', colour: '#3357FF', notes_count: 1 }
];

describe('CustomCategorySelect Component', () => {
  it('renders with the selected category displayed', () => {
    const onChange = jest.fn();
    
    const { container } = render(
      <CustomCategorySelect 
        categories={mockCategories} 
        selectedId={2} 
        onChange={onChange} 
      />
    );
    
    // First approach: get the span directly to be more specific
    const selectedDisplay = container.querySelector('.p-2.pl-8 span');
    expect(selectedDisplay).toHaveTextContent('Personal');
    
    // Alternative approach: use the within + getByText combo
    // const mainDiv = screen.getByRole('combobox', { hidden: true }).parentElement;
    // const selectedText = within(mainDiv).getByText('Personal');
    // expect(selectedText).toBeInTheDocument();
  });

  it('displays the first category when no selectedId is provided', () => {
    const onChange = jest.fn();
    
    const { container } = render(
      <CustomCategorySelect 
        categories={mockCategories} 
        selectedId={null} 
        onChange={onChange} 
      />
    );
    
    // Use a more specific query for the displayed text
    const displayedValue = container.querySelector('.p-2.pl-8 span');
    expect(displayedValue).toHaveTextContent('Work');
  });

  it('opens dropdown when clicked', async () => {
    const onChange = jest.fn();
    
    const { container } = render(
      <CustomCategorySelect 
        categories={mockCategories} 
        selectedId={1} 
        onChange={onChange} 
      />
    );
    
    // Initially dropdown should be closed - there should be no dropdown div
    expect(container.querySelector('.absolute.z-10')).not.toBeInTheDocument();
    
    // Click to open dropdown
    await act(async () => {
      const selectButton = container.querySelector('.p-2.pl-8');
      fireEvent.click(selectButton);
    });
    
    // After click, dropdown should be open with options
    const dropdown = container.querySelector('.absolute.z-10');
    expect(dropdown).toBeInTheDocument();
    expect(dropdown).toHaveTextContent('Ideas');
  });

  it('calls onChange when a new category is selected', async () => {
    const onChange = jest.fn();
    
    const { container } = render(
      <CustomCategorySelect 
        categories={mockCategories} 
        selectedId={1} 
        onChange={onChange} 
      />
    );
    
    // Open dropdown
    await act(async () => {
      const selectButton = container.querySelector('.p-2.pl-8');
      fireEvent.click(selectButton);
    });
    
    // Select a different category
    await act(async () => {
      // Find the dropdown option for Ideas
      const dropdownItems = container.querySelectorAll('.absolute.z-10 .hover\\:bg-gray-100');
      // The Ideas option should be the 3rd one (index 2)
      const ideasOption = Array.from(dropdownItems).find(item => 
        item.textContent.includes('Ideas')
      );
      fireEvent.click(ideasOption);
    });
    
    // Check if onChange was called with the correct ID
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('closes dropdown after selection', async () => {
    const onChange = jest.fn();
    
    const { container } = render(
      <CustomCategorySelect 
        categories={mockCategories} 
        selectedId={1} 
        onChange={onChange} 
      />
    );
    
    // Open dropdown
    await act(async () => {
      const selectButton = container.querySelector('.p-2.pl-8');
      fireEvent.click(selectButton);
    });
    
    // Verify dropdown is open
    expect(container.querySelector('.absolute.z-10')).toBeInTheDocument();
    
    // Select a category
    await act(async () => {
      const dropdownItems = container.querySelectorAll('.absolute.z-10 .hover\\:bg-gray-100');
      const personalOption = Array.from(dropdownItems).find(item => 
        item.textContent.includes('Personal')
      );
      fireEvent.click(personalOption);
    });
    
    // Dropdown should now be closed
    expect(container.querySelector('.absolute.z-10')).not.toBeInTheDocument();
  });

  it('displays correct color dot for selected category', () => {
    const onChange = jest.fn();
    
    const { container } = render(
      <CustomCategorySelect 
        categories={mockCategories} 
        selectedId={2} 
        onChange={onChange} 
      />
    );
    
    // Find the color dot in the selected display
    const colorDot = container.querySelector('.absolute.left-2');
    expect(colorDot).toHaveStyle(`background-color: ${mockCategories[1].colour}`);
  });

  it('closes dropdown when clicking outside', async () => {
    const onChange = jest.fn();
    
    const { container } = render(
      <CustomCategorySelect 
        categories={mockCategories} 
        selectedId={1} 
        onChange={onChange} 
      />
    );
    
    // Open dropdown
    await act(async () => {
      const selectButton = container.querySelector('.p-2.pl-8');
      fireEvent.click(selectButton);
    });
    
    // Verify dropdown is open
    expect(container.querySelector('.absolute.z-10')).toBeInTheDocument();
    
    // Click outside
    await act(async () => {
      fireEvent.mouseDown(document.body);
    });
    
    // Dropdown should now be closed
    await waitFor(() => {
      expect(container.querySelector('.absolute.z-10')).not.toBeInTheDocument();
    });
  });

  it('handles empty categories array gracefully', () => {
    const onChange = jest.fn();
    
    const { container } = render(
      <CustomCategorySelect 
        categories={[]} 
        selectedId={null} 
        onChange={onChange} 
      />
    );
    
    // Should display the default text in the span
    const displayedValue = container.querySelector('.p-2.pl-8 span');
    expect(displayedValue).toHaveTextContent('Select category');
  });
});