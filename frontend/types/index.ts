export interface Category {
    id: number;
    name: string;
    colour: string;
    notes_count: number;
  }
  
  export interface Note {
    id: number;
    title: string;
    content: string;
    date: string;
    category: Category;
    created_at: string;
    updated_at: string;
  }