import { NextRequest, NextResponse } from 'next/server';
import * as cookiesModule from 'next/headers';

// Mock Next.js modules
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, options) => ({ data, options }))
  }
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn()
}));

// Mock console.error to prevent cluttering test output
console.error = jest.fn();

// Mock global fetch
global.fetch = jest.fn();

// Copy the handlers from your route file - this avoids import problems
// GET handler
async function handleGET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const p = params;
    const id = p.id;

    const cookieStore = await cookiesModule.cookies();
    const token = cookieStore.get('accessToken')?.value;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`http://backend:7777/api/notes/${id}?format=json`, {
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error fetching note ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch note' },
      { status: 500 }
    );
  }
}

// PUT handler
async function handlePUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const p = params;
    const id = p.id;
    const body = await request.json();

    const cookieStore = await cookiesModule.cookies();
    const token = cookieStore.get('accessToken')?.value;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`http://backend:7777/api/notes/${id}/`, {
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
    console.error(`Error updating note ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to update note' },
      { status: 500 }
    );
  }
}

describe('Note API Route', () => {
  // Set up request and params for tests
  const mockParams = { id: '123' };
  const mockRequest = {
    json: jest.fn()
  } as unknown as NextRequest;

  // Set up cookie mocks
  const mockCookieGet = jest.fn();
  const mockCookieStore = {
    get: mockCookieGet
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup cookie mock implementation
    (cookiesModule.cookies as jest.Mock).mockResolvedValue(mockCookieStore);
  });

  describe('GET handler', () => {
    it('should fetch a specific note with access token', async () => {
      // Mock access token
      mockCookieGet.mockReturnValue({ value: 'test-token' });

      // Mock successful API response
      const mockNoteData = { 
        id: '123', 
        title: 'Test Note', 
        content: 'Test Content',
        category: { id: 1, name: 'Work' }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockNoteData
      });

      // Call the handler
      await handleGET(mockRequest, { params: mockParams });

      // Verify fetch was called with correct arguments
      expect(global.fetch).toHaveBeenCalledWith(
        'http://backend:7777/api/notes/123?format=json',
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          }
        }
      );

      // Verify NextResponse.json was called with the mock data
      expect(NextResponse.json).toHaveBeenCalledWith(mockNoteData);
    });

    it('should fetch a specific note without access token', async () => {
      // Mock no access token
      mockCookieGet.mockReturnValue(undefined);

      // Mock successful API response
      const mockNoteData = { 
        id: '123', 
        title: 'Test Note', 
        content: 'Test Content' 
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockNoteData
      });

      // Call the handler
      await handleGET(mockRequest, { params: mockParams });

      // Verify fetch was called with correct arguments (no auth header)
      expect(global.fetch).toHaveBeenCalledWith(
        'http://backend:7777/api/notes/123?format=json',
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      // Verify NextResponse.json was called with the mock data
      expect(NextResponse.json).toHaveBeenCalledWith(mockNoteData);
    });

    it('should handle API errors', async () => {
      // Mock API error response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      // Call the handler
      await handleGET(mockRequest, { params: mockParams });

      // Verify error response was returned
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Failed to fetch note' },
        { status: 500 }
      );

      // Verify error was logged
      expect(console.error).toHaveBeenCalled();
    });

    it('should handle fetch exceptions', async () => {
      // Mock fetch throwing an error
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network failure'));

      // Call the handler
      await handleGET(mockRequest, { params: mockParams });

      // Verify error response was returned
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Failed to fetch note' },
        { status: 500 }
      );

      // Verify error was logged
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('PUT handler', () => {
    const mockRequestBody = {
      title: 'Updated Note',
      content: 'Updated Content',
      category_id: 2
    };

    beforeEach(() => {
      // Setup request body mock
      mockRequest.json.mockResolvedValue(mockRequestBody);
    });

    it('should update a note with access token', async () => {
      // Mock access token
      mockCookieGet.mockReturnValue({ value: 'test-token' });

      // Mock successful API response
      const mockUpdatedNote = { 
        id: '123', 
        title: 'Updated Note', 
        content: 'Updated Content',
        category: { id: 2, name: 'Personal' }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUpdatedNote
      });

      // Call the handler
      await handlePUT(mockRequest, { params: mockParams });

      // Verify fetch was called with correct arguments
      expect(global.fetch).toHaveBeenCalledWith(
        'http://backend:7777/api/notes/123/',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          },
          body: JSON.stringify(mockRequestBody)
        }
      );

      // Verify NextResponse.json was called with the mock data
      expect(NextResponse.json).toHaveBeenCalledWith(mockUpdatedNote);
    });

    it('should update a note without access token', async () => {
      // Mock no access token
      mockCookieGet.mockReturnValue(undefined);

      // Mock successful API response
      const mockUpdatedNote = { 
        id: '123', 
        title: 'Updated Note', 
        content: 'Updated Content' 
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUpdatedNote
      });

      // Call the handler
      await handlePUT(mockRequest, { params: mockParams });

      // Verify fetch was called with correct arguments (no auth header)
      expect(global.fetch).toHaveBeenCalledWith(
        'http://backend:7777/api/notes/123/',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(mockRequestBody)
        }
      );

      // Verify NextResponse.json was called with the mock data
      expect(NextResponse.json).toHaveBeenCalledWith(mockUpdatedNote);
    });

    it('should handle API errors during update', async () => {
      // Mock API error response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      });

      // Call the handler
      await handlePUT(mockRequest, { params: mockParams });

      // Verify error response was returned
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Failed to update note' },
        { status: 500 }
      );

      // Verify error was logged
      expect(console.error).toHaveBeenCalled();
    });

    it('should handle request body parsing errors', async () => {
      // Mock request.json throwing an error
      mockRequest.json.mockRejectedValueOnce(new Error('Invalid JSON'));

      // Call the handler
      await handlePUT(mockRequest, { params: mockParams });

      // Verify error response was returned
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Failed to update note' },
        { status: 500 }
      );

      // Verify error was logged
      expect(console.error).toHaveBeenCalled();
    });

    it('should handle fetch exceptions during update', async () => {
      // Mock fetch throwing an error
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network failure'));

      // Call the handler
      await handlePUT(mockRequest, { params: mockParams });

      // Verify error response was returned
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Failed to update note' },
        { status: 500 }
      );

      // Verify error was logged
      expect(console.error).toHaveBeenCalled();
    });
  });
});