import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, usePathname } from 'next/navigation';
import { AuthProvider, useAuth } from '@/components/AuthProvider';
import { getAccessToken, clearTokens } from '@/lib/auth';

// Mock the next/navigation hooks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

// Mock the auth utility functions
jest.mock('@/lib/auth', () => ({
  getAccessToken: jest.fn(),
  clearTokens: jest.fn(),
}));

// Simple test component that uses the auth context
function TestComponent() {
  const { isAuthenticated, loading, logout } = useAuth();
  
  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? 'Authenticated' : 'Not authenticated'}</div>
      <div data-testid="loading-status">{loading ? 'Loading' : 'Not loading'}</div>
      <button data-testid="logout-button" onClick={logout}>Logout</button>
    </div>
  );
}

describe('AuthProvider', () => {
  const mockPush = jest.fn();
  const mockRouter = { push: mockPush };

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock implementations
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (usePathname as jest.Mock).mockReturnValue('/dashboard');
  });


it('should handle loading state and resolve to authenticated state', async () => {
    (getAccessToken as jest.Mock).mockReturnValue('valid-token');
  
    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
    });
  
    // After initialization, should not be in loading state
    expect(screen.getByTestId('loading-status').textContent).toBe('Not loading');
    // And should be authenticated
    expect(screen.getByTestId('auth-status').textContent).toBe('Authenticated');
  });

  it('should set isAuthenticated to true when token exists', async () => {
    (getAccessToken as jest.Mock).mockReturnValue('valid-token');

    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
    });

    expect(screen.getByTestId('auth-status').textContent).toBe('Authenticated');
    expect(screen.getByTestId('loading-status').textContent).toBe('Not loading');
  });

  it('should set isAuthenticated to false when token does not exist', async () => {
    (getAccessToken as jest.Mock).mockReturnValue(null);

    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
    });

    expect(screen.getByTestId('auth-status').textContent).toBe('Not authenticated');
  });

  it('should redirect to dashboard if user is authenticated and on login page', async () => {
    (getAccessToken as jest.Mock).mockReturnValue('valid-token');
    (usePathname as jest.Mock).mockReturnValue('/login');

    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
    });

    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('should not redirect if user is authenticated but not on login page', async () => {
    (getAccessToken as jest.Mock).mockReturnValue('valid-token');
    (usePathname as jest.Mock).mockReturnValue('/dashboard');

    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should provide a logout function that clears tokens and redirects to login', async () => {
    (getAccessToken as jest.Mock).mockReturnValue('valid-token');
    
    const user = userEvent.setup();

    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
    });

    // Verify initial authenticated state
    expect(screen.getByTestId('auth-status').textContent).toBe('Authenticated');

    // Click logout button
    await user.click(screen.getByTestId('logout-button'));

    // Verify clearTokens was called
    expect(clearTokens).toHaveBeenCalled();
    
    // Verify redirect to login page
    expect(mockPush).toHaveBeenCalledWith('/login');
    
    // Verify authentication state was updated
    expect(screen.getByTestId('auth-status').textContent).toBe('Not authenticated');
  });

  it('should not redirect if on a protected route and token exists', async () => {
    (getAccessToken as jest.Mock).mockReturnValue('valid-token');
    (usePathname as jest.Mock).mockReturnValue('/notes/1/edit');

    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
    });

    expect(mockPush).not.toHaveBeenCalled();
    expect(screen.getByTestId('auth-status').textContent).toBe('Authenticated');
  });
});