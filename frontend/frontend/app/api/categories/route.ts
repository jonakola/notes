import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getApiUrl } from '@/config/api';

export async function GET() {
  try {
    
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const url = getApiUrl('/api/categories', { format: 'json' });
  
    const response = await fetch(url, {
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
   
    if (data.results && Array.isArray(data.results)) {
      return NextResponse.json(data.results);
    } else {
      console.error('Unexpected API response format:', data);
      return NextResponse.json([], { status: 200 }); 
    }
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
