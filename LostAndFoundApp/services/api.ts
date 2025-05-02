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
  async getAll(filter?: string): Promise<ItemResponseDTO[]> {
    try {
      console.log('Getting items with filter:', filter);
      
      // Validate and normalize filter
      let normalizedFilter: string | undefined;
      if (filter) {
        const validFilters = ['lost', 'found', 'solved', 'all'];
        const lowercaseFilter = filter.toLowerCase();
        if (!validFilters.includes(lowercaseFilter)) {
          console.error('Invalid filter value:', filter);
          throw new Error(`Invalid filter value: ${filter}`);
        }
        normalizedFilter = lowercaseFilter;
      }
      
      // Construct URL with normalized filter
      const url = `${API_ENDPOINTS.ITEMS}${normalizedFilter ? `?filter=${normalizedFilter}` : ''}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      try {
        console.log('Sending request to API with headers:', JSON.stringify(API_DEFAULT_HEADERS));
        const response = await fetch(url, {
          headers: API_DEFAULT_HEADERS,
          signal: controller.signal,
          cache: 'no-cache' // Disable caching to ensure fresh data
        });
        
        clearTimeout(timeoutId);
        
        console.log('Items response status:', response.status, response.statusText);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response body:', errorText);
          throw new Error(`Failed to fetch items: ${response.status} ${response.statusText}`);
        }
        
        const items = await response.json();
        
        // Verify items match the filter criteria
        const verifiedItems = items.filter((item: ItemResponseDTO) => {
          if (!normalizedFilter || normalizedFilter === 'all') {
            // By default, show unsolved items
            return !item.isSolved;
          }
          switch (normalizedFilter) {
            case 'lost':
              return item.isLost && !item.isSolved;
            case 'found':
              return !item.isLost && !item.isSolved;
            case 'solved':
              return item.isSolved;
            default:
              return !item.isSolved;
          }
        });
        
        console.log('Fetched and verified items:', {
          total: verifiedItems.length,
          solved: verifiedItems.filter((i: ItemResponseDTO) => i.isSolved).length,
          unsolved: verifiedItems.filter((i: ItemResponseDTO) => !i.isSolved).length,
          lost: verifiedItems.filter((i: ItemResponseDTO) => i.isLost && !i.isSolved).length,
          found: verifiedItems.filter((i: ItemResponseDTO) => !i.isLost && !i.isSolved).length
        });
        
        return verifiedItems;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    } catch (error) {
      console.error('Error fetching items:', error);
      throw error;
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
      // Get the auth token
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        console.error('No auth token found for update request');
        throw new Error('Authentication required');
      }

      const headers = {
        ...API_DEFAULT_HEADERS,
        'Authorization': `Bearer ${token}`
      };

      console.log('Making PUT request to:', API_ENDPOINTS.ITEM_DETAIL(id.toString()));
      console.log('With headers:', { ...headers, Authorization: 'Bearer [TOKEN]' });
      console.log('And body:', JSON.stringify(item, null, 2));

      const response = await fetch(API_ENDPOINTS.ITEM_DETAIL(id.toString()), {
        method: 'PUT',
        headers,
        body: JSON.stringify(item),
      });

      console.log('Response status:', response.status);

      // Handle 204 No Content response - this means the update was successful
      if (response.status === 204) {
        console.log('Update successful (204 No Content)');
        
        // Retry fetching the updated item until we see the changes or hit max retries
        const maxRetries = 5;
        const retryDelay = 1000; // 1 second between retries
        
        for (let i = 0; i < maxRetries; i++) {
          console.log(`Attempt ${i + 1} of ${maxRetries} to fetch updated item`);
          
          // Wait before fetching
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          
          // Fetch the updated item
          const updatedItem = await itemsApi.getById(id);
          console.log('Fetched item state:', {
            isSolved: updatedItem.isSolved,
            isLost: updatedItem.isLost
          });
          
          // Check if the update is reflected
          if (item.isSolved !== undefined && updatedItem.isSolved === item.isSolved) {
            console.log('Update confirmed in database');
            return updatedItem;
          }
          
          console.log('Update not yet reflected in database, retrying...');
        }
        
        console.warn('Max retries reached, returning last fetched state');
        return await itemsApi.getById(id);
      }

      const responseText = await response.text();
      console.log('Response text:', responseText);

      if (!response.ok) {
        console.error('Server error response:', responseText);
        throw new Error(`Server error: ${response.status} - ${responseText}`);
      }

      try {
        const parsedResponse = JSON.parse(responseText);
        console.log('Parsed response:', parsedResponse);
        return parsedResponse;
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        throw new Error('Invalid response format from server');
      }
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

  // Update all item states
  async updateAllStates(): Promise<void> {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        console.error('No auth token found for update request');
        throw new Error('Authentication required');
      }

      const headers = {
        ...API_DEFAULT_HEADERS,
        'Authorization': `Bearer ${token}`
      };

      console.log('Making POST request to update all item states');
      
      const response = await fetch(`${API_ENDPOINTS.ITEMS}/UpdateAllStates`, {
        method: 'POST',
        headers
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      console.log('Successfully updated all item states');
    } catch (error) {
      console.error('Error updating item states:', error);
      throw error;
    }
  },

  // Mark item as solved
  async markAsSolved(id: number): Promise<ItemResponseDTO> {
    try {
      // Get the auth token
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        console.error('No auth token found for mark as solved request');
        throw new Error('Authentication required');
      }

      const headers = {
        ...API_DEFAULT_HEADERS,
        'Authorization': `Bearer ${token}`
      };

      console.log('Making POST request to mark item as solved:', API_ENDPOINTS.ITEM_DETAIL(id.toString()) + '/MarkAsSolved');
      console.log('With headers:', { ...headers, Authorization: 'Bearer [TOKEN]' });

      const response = await fetch(API_ENDPOINTS.ITEM_DETAIL(id.toString()) + '/MarkAsSolved', {
        method: 'POST',
        headers
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const updatedItem = await response.json();
      console.log('Item marked as solved:', updatedItem);
      return updatedItem;
    } catch (error) {
      console.error('Error marking item as solved:', error);
      throw error;
    }
  }
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