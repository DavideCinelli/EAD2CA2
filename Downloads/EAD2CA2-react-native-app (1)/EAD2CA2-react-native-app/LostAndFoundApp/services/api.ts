import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_DEFAULT_HEADERS, API_ENDPOINTS } from '../constants/Api';
import {
    ItemCreateDTO,
    ItemResponseDTO,
    ItemUpdateDTO,
    UserLoginDTO,
    UserRegisterDTO,
    UserResponseDTO
} from '../types/api';

// Mock data for testing when API is down
const MOCK_ITEMS: ItemResponseDTO[] = [
  {
    id: 1,
    name: "iPhone 13",
    description: "Lost my iPhone 13 Pro Max in blue color. Last seen at the university library.",
    category: "Electronics",
    location: "University Library",
    date: "2025-04-25",
    isLost: true,
    isSolved: false,
    imageUrl: "https://images.unsplash.com/photo-1592286927505-1def25115558",
    userId: 1,
    username: "johndoe"
  },
  {
    id: 2,
    name: "Black Wallet",
    description: "Found a black leather wallet with some cash and cards inside at Central Park.",
    category: "Accessories",
    location: "Central Park",
    date: "2025-04-26",
    isLost: false,
    isSolved: false,
    imageUrl: "https://images.unsplash.com/photo-1610297169535-69aed7c3e85e",
    userId: 2,
    username: "janedoe"
  },
  {
    id: 3,
    name: "Gold Necklace",
    description: "Lost gold necklace with heart-shaped pendant. Has sentimental value.",
    category: "Jewelry",
    location: "City Mall",
    date: "2025-04-20",
    isLost: true,
    isSolved: true,
    imageUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f",
    userId: 1,
    username: "johndoe"
  }
];

// Mock user for authentication when server is down
const MOCK_USER: UserResponseDTO = {
  id: 1,
  username: "testuser",
  email: "test@example.com",
  token: "mock-jwt-token-for-testing-purposes-only"
};

// Helper to get auth token
export const getAuthHeader = async () => {
  const token = await AsyncStorage.getItem('userToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Items API
export const itemsApi = {
  // Get all items
  async getAll(): Promise<ItemResponseDTO[]> {
    try {
      console.log('Fetching items from:', API_ENDPOINTS.ITEMS);
      
      // Test network connectivity first
      try {
        console.log('Testing network connectivity...');
        const testResponse = await fetch(API_ENDPOINTS.ITEMS, { 
          method: 'GET',
          headers: API_DEFAULT_HEADERS,
          cache: 'no-cache'
        });
        console.log('Network connectivity test:', testResponse.ok ? 'Success' : 'Failed');
      } catch (networkErr) {
        console.error('Network connectivity test failed:', networkErr);
      }
      
      // Add timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout
      
      try {
        console.log('Sending request to API with headers:', JSON.stringify(API_DEFAULT_HEADERS));
        const response = await fetch(API_ENDPOINTS.ITEMS, {
          headers: API_DEFAULT_HEADERS,
          signal: controller.signal,
          cache: 'no-cache' // Disable caching to ensure fresh data
        });
        
        clearTimeout(timeoutId);
        
        console.log('Items response status:', response.status, response.statusText);
        console.log('Response headers:', JSON.stringify(Object.fromEntries([...response.headers])));
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response body:', errorText);
          
          // Return mock data for 500 errors to allow development to continue
          if (response.status === 500) {
            console.log('Falling back to mock data due to server error');
            return MOCK_ITEMS;
          }
          
          throw new Error(`Failed to fetch items: ${response.status} ${response.statusText}`);
        }
        
        const responseText = await response.text();
        console.log('Response text preview:', responseText.substring(0, 100) + '...');
        
        try {
          const data = JSON.parse(responseText);
          console.log('Successfully parsed JSON data, count:', Array.isArray(data) ? data.length : 'Not an array');
          
          // If API returns null or not an array, return empty array
          if (!data || !Array.isArray(data)) {
            console.warn('API returned non-array data:', typeof data);
            return MOCK_ITEMS; // Use mock data as fallback
          }
          
          return data;
        } catch (jsonError) {
          console.error('JSON parse error:', jsonError);
          console.error('Response was not valid JSON:', responseText.substring(0, 200));
          return MOCK_ITEMS; // Use mock data as fallback
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        console.error('Fetch error details:', fetchError);
        if (fetchError.name === 'AbortError') {
          console.error('Request timed out');
          console.log('Falling back to mock data due to timeout');
          return MOCK_ITEMS; // Use mock data as fallback for timeouts
        }
        throw fetchError;
      }
    } catch (error) {
      console.error('Error fetching items:', error);
      // Return mock data instead of empty array to allow testing
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        console.log('Network error, returning mock data');
        return MOCK_ITEMS;
      }
      if (error instanceof Error && error.message.includes('500')) {
        console.log('Server error (500), returning mock data');
        return MOCK_ITEMS;
      }
      return MOCK_ITEMS; // Use mock data for all errors
    }
  },

  // Get item by id
  async getById(id: number): Promise<ItemResponseDTO> {
    try {
      const response = await fetch(API_ENDPOINTS.ITEM_DETAIL(id.toString()), {
        headers: API_DEFAULT_HEADERS
      });
      if (!response.ok) {
        console.error(`Failed to fetch item with ID ${id}: ${response.status}`);
        // Return mock item if server error
        const mockItem = MOCK_ITEMS.find(item => item.id === id);
        if (mockItem) {
          console.log(`Returning mock item for ID ${id}`);
          return mockItem;
        }
        throw new Error('Failed to fetch item');
      }
      return response.json();
    } catch (error) {
      console.error('Error in getById:', error);
      // Try to find the item in mock data
      const mockItem = MOCK_ITEMS.find(item => item.id === id);
      if (mockItem) {
        console.log(`Returning mock item for ID ${id} after error`);
        return mockItem;
      }
      throw error;
    }
  },

  // Create new item
  async create(item: ItemCreateDTO): Promise<ItemResponseDTO> {
    try {
      const authHeader = await getAuthHeader();
      const headers: Record<string, string> = {
        ...API_DEFAULT_HEADERS,
        ...(authHeader as Record<string, string>)
      };
      
      console.log('Making POST request to:', API_ENDPOINTS.ITEMS);
      console.log('Request headers:', headers);
      console.log('Request body:', JSON.stringify(item, null, 2));
      
      const response = await fetch(API_ENDPOINTS.ITEMS, {
        method: 'POST',
        headers,
        body: JSON.stringify(item),
      });

      console.log('Response status:', response.status);
      const responseText = await response.text();
      console.log('Response body:', responseText);

      if (!response.ok) {
        console.error(`Failed to create item: ${response.status}`);
        console.error('Error response:', responseText);
        throw new Error(`Server error: ${responseText}`);
      }

      return JSON.parse(responseText);
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  },

  // Update item
  async update(id: number, item: ItemUpdateDTO): Promise<ItemResponseDTO> {
    try {
      const authHeader = await getAuthHeader();
      const headers: Record<string, string> = {
        ...API_DEFAULT_HEADERS,
        ...(authHeader as Record<string, string>)
      };

      console.log('Making PUT request to:', API_ENDPOINTS.ITEM_DETAIL(id.toString()));
      console.log('Request headers:', headers);
      console.log('Request body:', JSON.stringify(item, null, 2));

      const response = await fetch(API_ENDPOINTS.ITEM_DETAIL(id.toString()), {
        method: 'PUT',
        headers,
        body: JSON.stringify(item),
      });

      console.log('Response status:', response.status);
      const responseText = await response.text();
      console.log('Response body:', responseText);

      if (!response.ok) {
        console.error(`Failed to update item ${id}: ${response.status}`);
        console.error('Error response:', responseText);
        throw new Error(`Server error: ${responseText}`);
      }

      // Only parse as JSON if we have content
      return responseText ? JSON.parse(responseText) : null;
    } catch (error) {
      console.error('Error in update:', error);
      throw error;
    }
  },

  // Delete item
  async delete(id: number): Promise<void> {
    try {
      const authHeader = await getAuthHeader();
      const headers: Record<string, string> = {
        ...API_DEFAULT_HEADERS,
        ...(authHeader as Record<string, string>)
      };

      const response = await fetch(API_ENDPOINTS.ITEM_DETAIL(id.toString()), {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to delete item ${id}: ${response.status}`);
        console.error('Error response:', errorText);
        throw new Error(`Server error: ${errorText}`);
      }
    } catch (error) {
      console.error('Error in delete:', error);
      throw error;
    }
  },
};

// Users API
export const usersApi = {
  // Register new user
  async register(user: UserRegisterDTO): Promise<UserResponseDTO> {
    try {
      console.log('Registering user:', { ...user, password: '***' });
      
      const response = await fetch(API_ENDPOINTS.USER_REGISTER, {
        method: 'POST',
        headers: API_DEFAULT_HEADERS,
        body: JSON.stringify(user),
      });
      
      // First try to get the response as text to debug
      const responseText = await response.text();
      console.log('Registration response status:', response.status);
      console.log('Registration response text:', responseText);
      
      if (!response.ok) {
        let errorMessage = 'Failed to register user';
        
        try {
          // Try to parse the error as JSON
          const errorData = JSON.parse(responseText);
          if (errorData.message || errorData.error) {
            errorMessage = errorData.message || errorData.error;
          }
        } catch (e) {
          // If not JSON, use the text response as the error message
          if (responseText && responseText.trim()) {
            errorMessage = responseText;
          }
        }
        
        console.error(`Registration failed with status ${response.status}: ${errorMessage}`);
        
        // For development, return a mock user if server down
        if (response.status === 500) {
          console.log('Server error, using mock user registration');
          const mockRegisteredUser = {
            ...MOCK_USER,
            username: user.username,
            email: user.email
          };
          
          // Store the token for future authenticated requests
          await AsyncStorage.setItem('userToken', mockRegisteredUser.token);
          await AsyncStorage.setItem('userId', mockRegisteredUser.id.toString());
          await AsyncStorage.setItem('userData', JSON.stringify(mockRegisteredUser));
          
          return mockRegisteredUser;
        }
        
        throw new Error(errorMessage);
      }
      
      let userData;
      try {
        userData = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse user data:', e);
        throw new Error('Invalid response from server');
      }
      
      // Store the token for future authenticated requests
      if (userData.token) {
        await AsyncStorage.setItem('userToken', userData.token);
        await AsyncStorage.setItem('userId', userData.id.toString());
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
      } else {
        console.warn('No token received from server during registration');
      }
      
      return userData;
    } catch (error) {
      console.error('Registration error:', error);
      
      // For development, if network error, use mock authentication
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        console.log('Network error during registration, using mock user');
        const mockRegisteredUser = {
          ...MOCK_USER,
          username: user.username,
          email: user.email
        };
        
        // Store the mock data
        await AsyncStorage.setItem('userToken', mockRegisteredUser.token);
        await AsyncStorage.setItem('userId', mockRegisteredUser.id.toString());
        await AsyncStorage.setItem('userData', JSON.stringify(mockRegisteredUser));
        
        return mockRegisteredUser;
      }
      
      throw error;
    }
  },

  // Login user
  async login(credentials: UserLoginDTO): Promise<UserResponseDTO> {
    try {
      console.log('Logging in user:', { ...credentials, password: '***' });
      
      const response = await fetch(API_ENDPOINTS.USER_LOGIN, {
        method: 'POST',
        headers: API_DEFAULT_HEADERS,
        body: JSON.stringify(credentials),
      });
      
      // First try to get the response as text to debug
      const responseText = await response.text();
      console.log('Login response status:', response.status);
      console.log('Login response text:', responseText);
      
      if (!response.ok) {
        let errorMessage = 'Failed to login';
        
        try {
          // Try to parse the error as JSON
          const errorData = JSON.parse(responseText);
          if (errorData.message || errorData.error) {
            errorMessage = errorData.message || errorData.error;
          }
        } catch (e) {
          // If not JSON, use the text response as the error message
          if (responseText && responseText.trim()) {
            errorMessage = responseText;
          }
        }
        
        console.error(`Login failed with status ${response.status}: ${errorMessage}`);
        
        // For development, allow mock login if server is down
        if (response.status === 500) {
          console.log('Server error, using mock login');
          const mockLoggedInUser = {
            ...MOCK_USER,
            username: credentials.username
          };
          
          // Store the token for future authenticated requests
          await AsyncStorage.setItem('userToken', mockLoggedInUser.token);
          await AsyncStorage.setItem('userId', mockLoggedInUser.id.toString());
          await AsyncStorage.setItem('userData', JSON.stringify(mockLoggedInUser));
          
          return mockLoggedInUser;
        }
        
        throw new Error(errorMessage);
      }
      
      let userData;
      try {
        userData = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse user data:', e);
        throw new Error('Invalid response from server');
      }
      
      // Store the token for future authenticated requests
      if (userData.token) {
        await AsyncStorage.setItem('userToken', userData.token);
        await AsyncStorage.setItem('userId', userData.id.toString());
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
      } else {
        console.warn('No token received from server during login');
      }
      
      return userData;
    } catch (error) {
      console.error('Login error:', error);
      
      // For development, if network error, use mock authentication
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        console.log('Network error during login, using mock user');
        const mockLoggedInUser = {
          ...MOCK_USER,
          username: credentials.username
        };
        
        // Store the mock data
        await AsyncStorage.setItem('userToken', mockLoggedInUser.token);
        await AsyncStorage.setItem('userId', mockLoggedInUser.id.toString());
        await AsyncStorage.setItem('userData', JSON.stringify(mockLoggedInUser));
        
        return mockLoggedInUser;
      }
      
      throw error;
    }
  },

  // Logout user
  async logout(): Promise<void> {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userId');
    await AsyncStorage.removeItem('userData');
  },

  // Get current user data
  async getCurrentUser(): Promise<UserResponseDTO | null> {
    const userData = await AsyncStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  },
}; 