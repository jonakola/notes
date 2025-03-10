// This is the actual logic that would be in your API route
async function fetchNotesFromBackend() {
    try {
      const response = await fetch('http://backend:7777/api/notes?format=json');
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      return { 
        success: true,
        data: data.results || data
      };
    } catch (error) {
      console.error('Error fetching notes:', error);
      return { 
        success: false,
        error: 'Failed to fetch notes' 
      };
    }
  }
  
  // Mock fetch globally
  global.fetch = jest.fn();
  
  describe('Notes API Logic', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
  
    it('should return notes data when API request succeeds', async () => {
      const mockData = {
        results: [
          { id: 1, title: 'Note 1', content: 'Content 1', category: { id: 1, name: 'Work' } },
          { id: 2, title: 'Note 2', content: 'Content 2', category: { id: 2, name: 'Personal' } }
        ]
      };
  
      // Mock successful fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });
  
      const result = await fetchNotesFromBackend();
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData.results);
      expect(global.fetch).toHaveBeenCalledWith('http://backend:7777/api/notes?format=json');
    });
  
    it('should handle API errors', async () => {
      // Mock failed fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });
  
      const result = await fetchNotesFromBackend();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to fetch notes');
    });
  });