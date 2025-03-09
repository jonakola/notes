'use client';

import { useState, useEffect, useRef } from 'react';
import { Category } from '@/types';

interface CategoryListProps {
  activeCategory: number | null;
  onCategorySelect: (categoryId: number | null, categoryData: Category | null) => void;
}

export default function CategoryList({ activeCategory, onCategorySelect }: CategoryListProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalNotes, setTotalNotes] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch categories from the API
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        const data = await response.json();
        setCategories(data);
        
        // Calculate total notes for "All Notes" count
        const total = data.reduce((sum: number, category: Category) => sum + category.notes_count, 0);
        setTotalNotes(total);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCategoryClick = (categoryId: number, categoryData: Category) => {
    // If the category is already active, deselect it
    if (activeCategory === categoryId) {
      onCategorySelect(null, null);
    } else {
      onCategorySelect(categoryId, categoryData);
    }
    
    // Close dropdown on mobile after selection
    setIsDropdownOpen(false);
  };

  const getActiveCategoryName = () => {
    if (activeCategory === null) return "All Notes";
    const selectedCategory = categories.find(cat => cat.id === activeCategory);
    return selectedCategory ? selectedCategory.name : "All Notes";
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Render content based on whether it's dropdown or expanded
  const renderCategoryList = () => (
    <ul className="space-y-3 mt-6">
      <li 
        className={`flex items-center justify-between text-sm text-brown-dark cursor-pointer hover:opacity-80 transition-opacity ${
          activeCategory === null ? 'font-bold' : ''
        }`}
        onClick={() => onCategorySelect(null, null)}
      >
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full mr-3 bg-gray-400"></div>
          <span>All Notes</span>
        </div>
        <span className="text-xs text-brown-light">
          {totalNotes}
        </span>
      </li>
      
      {categories.map((category) => (
        <li 
          key={category.id} 
          data-testid="category-item"
            data-category-id={category.id}
            data-category-name={category.name}
          className={`flex items-center justify-between text-sm text-brown-dark cursor-pointer hover:opacity-80 transition-opacity ${
            activeCategory === category.id ? 'font-bold' : ''
          }`}
          onClick={() => handleCategoryClick(category.id, category)}
        >
          <div className="flex items-center">
            <div 
              className="w-3 h-3 rounded-full mr-3"
              style={{ backgroundColor: category.colour }}
            ></div>
            <span>{category.name}</span>
          </div>
          <span className="text-xs text-brown-light">
            {category.notes_count}
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <div ref={dropdownRef}>
      {/* Desktop view - always visible on md and larger screens */}
      <div className="hidden md:block">
        <h2 className="text-xl font-semibold text-brown-dark mb-7">All Categories</h2>
        
        {loading ? (
          <p className="text-brown mt-6">Loading categories...</p>
        ) : (
          renderCategoryList()
        )}
      </div>

      {/* Mobile view - dropdown on smaller screens */}
      <div className="md:hidden">
        <div 
          className="flex items-center justify-between text-xl font-semibold text-brown-dark mb-4 cursor-pointer"
          onClick={toggleDropdown}
        >
          <h2>Categories: {getActiveCategoryName()}</h2>
          {isDropdownOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-brown-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-brown-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
        
        {/* Dropdown content */}
        {isDropdownOpen && !loading && (
          <div className="absolute z-10 w-full max-w-xs bg-white shadow-lg rounded-md p-4 border border-gray-200">
            {renderCategoryList()}
          </div>
        )}
        
        {loading && isDropdownOpen && (
          <div className="absolute z-10 w-full max-w-xs bg-white shadow-lg rounded-md p-4 border border-gray-200">
            <p className="text-brown">Loading categories...</p>
          </div>
        )}
      </div>
    </div>
  );
}