export const API_CONFIG = {
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://backend:7777',
  };
  
export const getApiUrl = (endpoint: string, queryParams?: Record<string, string>) => {
    const url = new URL(`${API_CONFIG.baseUrl}${endpoint}`);

    if (queryParams) {
        Object.entries(queryParams).forEach(([key, value]) => {
            url.searchParams.append(key, value);
        });
    }

    return url.toString();
};