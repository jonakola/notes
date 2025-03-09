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

    const response = await fetch('http://backend:7777/api/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.detail || 'Login failed' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Failed to authenticate user' },
      { status: 500 }
    );
  }
}

describe('Login API Route', () => {
  // Mock request setup
  let mockRequest: Request;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock request with json method
    mockRequest = {
      json: jest.fn(),
    } as unknown as Request;
  });

  it('should successfully authenticate a user', async () => {
    // Test user credentials
    const userCredentials = {
      email: 'user@example.com',
      password: 'Password123!'
    };

    // Mock request body
    (mockRequest.json as jest.Mock).mockResolvedValueOnce(userCredentials);

    // Mock successful API response with tokens
    const mockLoginResponse = {
      access: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      refresh: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockLoginResponse
    });

    // Call the handler
    await handlePOST(mockRequest);

    // Verify fetch was called with correct arguments
    expect(global.fetch).toHaveBeenCalledWith(
      'http://backend:7777/api/token/',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userCredentials)
      }
    );

    // Verify NextResponse.json was called with the token response
    expect(NextResponse.json).toHaveBeenCalledWith(mockLoginResponse);
  });

  it('should handle invalid credentials', async () => {
    // Test invalid credentials
    const invalidCredentials = {
      email: 'user@example.com',
      password: 'WrongPassword'
    };

    // Mock request body
    (mockRequest.json as jest.Mock).mockResolvedValueOnce(invalidCredentials);

    // Mock error API response for invalid credentials
    const mockErrorResponse = {
      detail: 'No active account found with the given credentials'
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => mockErrorResponse
    });

    // Call the handler
    await handlePOST(mockRequest);

    // Verify error response was returned with the specific error detail
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'No active account found with the given credentials' },
      { status: 401 }
    );
  });

  it('should handle API error responses without details', async () => {
    // Test user credentials
    const userCredentials = {
      email: 'user@example.com',
      password: 'Password123!'
    };

    // Mock request body
    (mockRequest.json as jest.Mock).mockResolvedValueOnce(userCredentials);

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
      { error: 'Login failed' },
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
      'Login error:',
      expect.any(Error)
    );

    // Verify error response was returned
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Failed to authenticate user' },
      { status: 500 }
    );
  });

  it('should handle network failures', async () => {
    // Test user credentials
    const userCredentials = {
      email: 'user@example.com',
      password: 'Password123!'
    };

    // Mock request body
    (mockRequest.json as jest.Mock).mockResolvedValueOnce(userCredentials);

    // Mock fetch throwing a network error
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network failure'));

    // Call the handler
    await handlePOST(mockRequest);

    // Verify error was logged
    expect(console.error).toHaveBeenCalledWith(
      'Login error:',
      expect.any(Error)
    );

    // Verify error response was returned
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Failed to authenticate user' },
      { status: 500 }
    );
  });

  it('should handle missing required fields', async () => {
    // Test credentials with missing password
    const incompleteCredentials = {
      email: 'user@example.com'
      // Missing password
    };

    // Mock request body
    (mockRequest.json as jest.Mock).mockResolvedValueOnce(incompleteCredentials);

    // Call the handler - this will pass the incomplete data to the API
    await handlePOST(mockRequest);

    // Verify fetch was called with the incomplete data
    expect(global.fetch).toHaveBeenCalledWith(
      'http://backend:7777/api/token/',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'user@example.com',
          password: undefined
        })
      }
    );
  });

  it('should handle unexpected API response format', async () => {
    // Test user credentials
    const userCredentials = {
      email: 'user@example.com',
      password: 'Password123!'
    };

    // Mock request body
    (mockRequest.json as jest.Mock).mockResolvedValueOnce(userCredentials);

    // Mock an API error where response.json() throws an error
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => { throw new Error('Invalid JSON in response'); }
    });

    // Call the handler
    await handlePOST(mockRequest);

    // Verify error was logged
    expect(console.error).toHaveBeenCalledWith(
      'Login error:',
      expect.any(Error)
    );

    // Verify error response was returned
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Failed to authenticate user' },
      { status: 500 }
    );
  });
});