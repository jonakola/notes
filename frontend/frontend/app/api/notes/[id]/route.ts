import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getApiUrl } from '@/config/api';

// GET handler for a specific note
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let id;  
  try {
    const p = await params;
    id = p.id;

    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const url = getApiUrl(`/api/notes/${id}`, { format: 'json'});
    const response = await fetch(url, {
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error fetching note ${id ?? 'unknown'}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch note' },
      { status: 500 }
    );
  }
}

// type RouteParams = { params: { id: string } };

// // GET handler for a specific note
// export async function GET(
//   request: NextRequest,
//   context: RouteParams
// ) {
//   try {
//     const id = context.params.id;

//     const cookieStore = await cookies();
//     const token = cookieStore.get('accessToken')?.value;
    
//     const headers: HeadersInit = {
//       'Content-Type': 'application/json',
//     };
    
//     if (token) {
//       headers['Authorization'] = `Bearer ${token}`;
//     }
    
//     const url = getApiUrl(`/api/notes/${id}`, { format: 'json'});
//     const response = await fetch(url, {
//       headers,
//     });
    
//     if (!response.ok) {
//       throw new Error(`API responded with status: ${response.status}`);
//     }
    
//     const data = await response.json();
//     return NextResponse.json(data);
//   } catch (error) {
//     console.error(`Error fetching note ${context.params.id}:`, error);
//     return NextResponse.json(
//       { error: 'Failed to fetch note' },
//       { status: 500 }
//     );
//   }
// }

// PUT handler to update a note
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let id;
  try {
    const p = await params;
    const id = p.id;
    const body = await request.json();

    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const url = getApiUrl(`/api/notes/${id}/`, { format: 'json'});
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error updating note ${id ?? 'unknown'}:`, error);
    return NextResponse.json(
      { error: 'Failed to update note' },
      { status: 500 }
    );
  }
}

