'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CategoryList from '@/components/CategoryList';
import NoteList from '@/components/NoteList';
import { Category } from '@/types';
import { useAuth } from '@/components/AuthProvider'; 

export default function Dashboard() {
  const router = useRouter();
  const { logout } = useAuth(); 
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [activeCategoryData, setActiveCategoryData] = useState<Category | null>(null);

  const handleNewNote = () => {
    router.push('/notes/new');
  };

  const handleCategorySelect = (categoryId: number | null, categoryData: Category | null) => {
    setActiveCategory(categoryId);
    setActiveCategoryData(categoryData);
  };

  return (
    <main className="p-6 max-w-7xl mx-auto bg-beige-50">
      <div className="flex flex-col md:flex-row">
        {/* Left Sidebar - Category List */}
        <div className="mt-1 w-full md:w-64 flex-shrink-0 mb-6 md:mb-0 md:mr-6">
          <CategoryList 
            activeCategory={activeCategory}
            onCategorySelect={handleCategorySelect}
          />
        </div>
        
        {/* Main Content Area - Notes */}
        <div className="flex-grow">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-xl font-semibold text-brown-dark">
              {activeCategoryData ? activeCategoryData.name : 'All Notes'}
            </h1>
            <div className="flex gap-3">
              <button
                onClick={handleNewNote}
                className="flex items-center bg-[#FAF1E3] border border-[#957139] rounded-full px-4 py-2 text-sm font-bold text-[#957139]  ring-[#957139]/50 hover:ring-2 cursor-pointer transition-all duration-200"
              >
                <span className="mr-1">+</span> New Note
              </button>
              <button
                onClick={logout}
                className="flex items-center bg-[#FAF1E3] border border-[#957139] rounded-full px-4 py-2 text-sm font-bold text-[#957139]  ring-[#957139]/50 hover:ring-2 cursor-pointer transition-all duration-200"
              >
                Logout
              </button>
            </div>
          </div>
          
          <NoteList activeCategory={activeCategory} />
        </div>
      </div>
    </main>
  );
}