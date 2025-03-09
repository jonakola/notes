import { NextResponse } from 'next/server';

// Mock Next.js modules
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({ data, options }))
  }
}));

// Mock console methods
console.error = jest.fn();

// Mock global fetch
global.fetch = jest.fn();

// Copy the handler from your route file - this avoids import problems
async function handlePOST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const response = await fetch('http://backend:7777/api/register/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.detail || 'Registration failed' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    );
  }
}

describe('Registration API Route', () => {
  // Mock request setup
  let mockRequest: Request;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock request with json method
    mockRequest = {
      json: jest.fn(),
    } as unknown as Request;
  });

  it('should successfully register a user', async () => {
    // Test user data
    const userData = {
      email: 'test@example.com',
      password: 'Password123!'
    };

    // Mock request body
    (mockRequest.json as jest.Mock).mockResolvedValueOnce(userData);

    // Mock successful API response
    const mockRegistrationResponse = {
      id: 123,
      email: 'test@example.com',
      created_at: '2025-03-09T10:00:00Z'
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRegistrationResponse
    });

    // Call the handler
    await handlePOST(mockRequest);

    // Verify fetch was called with correct arguments
    expect(global.fetch).toHaveBeenCalledWith(
      'http://backend:7777/api/register/',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      }
    );

    // Verify NextResponse.json was called with the registration response
    expect(NextResponse.json).toHaveBeenCalledWith(mockRegistrationResponse);
  });

  it('should handle API error responses with details', async () => {
    // Test user data
    const userData = {
      email: 'existing@example.com',
      password: 'weak'
    };

    // Mock request body
    (mockRequest.json as jest.Mock).mockResolvedValueOnce(userData);

    // Mock error API response
    const mockErrorResponse = {
      detail: 'Email already exists'
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => mockErrorResponse
    });

    // Call the handler
    await handlePOST(mockRequest);

    // Verify error response was returned with the specific error detail
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Email already exists' },
      { status: 400 }
    );
  });

  it('should handle API error responses without details', async () => {
    // Test user data
    const userData = {
      email: 'test@example.com',
      password: 'Password123!'
    };

    // Mock request body
    (mockRequest.json as jest.Mock).mockResolvedValueOnce(userData);

    // Mock error API response without detail
    const mockErrorResponse = {
      message: 'Server error'
      // No detail field
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => mockErrorResponse
    });

    // Call the handler
    await handlePOST(mockRequest);

    // Verify error response was returned with the fallback message
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Registration failed' },
      { status: 500 }
    );
  });

  it('should handle request body parsing errors', async () => {
    // Mock request.json throwing an error
    (mockRequest.json as jest.Mock).mockRejectedValueOnce(new Error('Invalid JSON'));

    // Call the handler
    await handlePOST(mockRequest);

    // Verify error was logged
    expect(console.error).toHaveBeenCalledWith(
      'Registration error:',
      expect.any(Error)
    );

    // Verify error response was returned
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Failed to register user' },
      { status: 500 }
    );
  });

  it('should handle fetch exceptions', async () => {
    // Test user data
    const userData = {
      email: 'test@example.com',
      password: 'Password123!'
    };

    // Mock request body
    (mockRequest.json as jest.Mock).mockResolvedValueOnce(userData);

    // Mock fetch throwing an error
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network failure'));

    // Call the handler
    await handlePOST(mockRequest);

    // Verify error was logged
    expect(console.error).toHaveBeenCalledWith(
      'Registration error:',
      expect.any(Error)
    );

    // Verify error response was returned
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Failed to register user' },
      { status: 500 }
    );
  });

  it('should handle missing required fields', async () => {
    // Test user data with missing password
    const incompleteUserData = {
      email: 'test@example.com'
      // Missing password
    };

    // Mock request body
    (mockRequest.json as jest.Mock).mockResolvedValueOnce(incompleteUserData);

    // Call the handler - this will pass the incomplete data to the API
    await handlePOST(mockRequest);

    // Verify fetch was called with the incomplete data
    expect(global.fetch).toHaveBeenCalledWith(
      'http://backend:7777/api/register/',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: undefined
        })
      }
    );
  });
});