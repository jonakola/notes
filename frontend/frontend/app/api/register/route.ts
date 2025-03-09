import { NextResponse } from 'next/server';
import { getApiUrl } from '@/config/api';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const url = getApiUrl('/api/register/');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        responseData,
        { status: response.status }
      );
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    );
  }
}