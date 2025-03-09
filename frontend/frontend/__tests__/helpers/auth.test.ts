// auth.test.ts
import { saveTokens, getAccessToken, getRefreshToken, clearTokens } from '@/lib/auth';

// Mock localStorage
const localStorageMock = (function() {
  let store = {};
  return {
    getItem: jest.fn(key => store[key]),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    })
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Auth utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  it('should save tokens to localStorage', () => {
    saveTokens('access123', 'refresh456');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('accessToken', 'access123');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('refreshToken', 'refresh456');
  });

  it('should retrieve tokens from localStorage', () => {
    localStorageMock.setItem('accessToken', 'test-access');
    localStorageMock.setItem('refreshToken', 'test-refresh');
    
    expect(getAccessToken()).toBe('test-access');
    expect(getRefreshToken()).toBe('test-refresh');
  });

  it('should clear tokens from localStorage', () => {
    localStorageMock.setItem('accessToken', 'test-access');
    localStorageMock.setItem('refreshToken', 'test-refresh');
    
    clearTokens();
    
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken');
  });
});