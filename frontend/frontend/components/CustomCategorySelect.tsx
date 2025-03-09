'use client';

import { useState, useEffect, useRef } from 'react';
import { Category } from '@/types';

interface CustomCategorySelectProps {
  categories: Category[];
  selectedId: number | null;
  onChange: (id: number) => void;
}

export default function CustomCategorySelect({ categories, selectedId, onChange }: CustomCategorySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const selectedCategory = categories.find(c => c.id === selectedId) || categories[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="mb-6 relative" ref={dropdownRef}>
      {/* Hidden native select for form submission */}
      <select
        id="category"
        value={selectedId || ''}
        onChange={(e) => onChange(Number(e.target.value))}
        className="sr-only"
      >
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
      
      {/* Custom select button */}
      <div
        className="p-2 pl-8 border border-gray-200 rounded focus:ring-2 focus:outline-none cursor-pointer flex items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selectedCategory?.name || 'Select category'}</span>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5 text-gray-500" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
        
        {/* Selected category dot */}
        <div 
          className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 rounded-full"
          style={{ backgroundColor: selectedCategory?.colour || '#CCCCCC' }}
        ></div>
      </div>
      
      {/* Dropdown options */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded shadow-lg max-h-60 overflow-auto">
          {categories.map((category) => (
            <div
              key={category.id}
              className={`p-2 pl-8 hover:bg-gray-100 cursor-pointer relative ${
                category.id === selectedId ? 'bg-gray-50 font-medium' : ''
              }`}
              onClick={() => {
                onChange(category.id);
                setIsOpen(false);
              }}
            >
              {category.name}
              
              {/* Category color dot */}
              <div 
                className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 rounded-full"
                style={{ backgroundColor: category.colour }}
              ></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}