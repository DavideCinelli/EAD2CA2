import { AuthProvider, useAuth } from '@/context/AuthContext';
import { act, render, waitFor } from '@testing-library/react-native';
import { Button, Text } from 'react-native';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

jest.mock('@/services/api', () => ({
  usersApi: {
    login: jest.fn().mockImplementation(async (credentials) => {
      if (credentials.username === 'testuser' && credentials.password === 'password') {
        return {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          token: 'fake-token'
        };
      }
      throw new Error('Invalid credentials');
    }),
    register: jest.fn().mockImplementation(async (userData) => {
      return {
        id: 2,
        username: userData.username,
        email: userData.email,
        token: 'new-user-token'
      };
    }),
    logout: jest.fn().mockResolvedValue(undefined),
    getCurrentUser: jest.fn().mockImplementation(async () => {
      const mockUserData = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com'
      };
      return mockUserData;
    })
  }
}));

const TestComponent = () => {
  const { user, login, logout, register, isLoading, isAuthenticated } = useAuth();
  
  return (
    <>
      <Text testID="loading-status">{isLoading ? 'Loading' : 'Not Loading'}</Text>
      <Text testID="auth-status">{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</Text>
      {user && <Text testID="username">{user.username}</Text>}
      
      <Button 
        testID="login-button"
        title="Login" 
        onPress={() => login({ username: 'testuser', password: 'password' })} 
      />
      
      <Button 
        testID="register-button"
        title="Register" 
        onPress={() => register({ 
          username: 'newuser', 
          email: 'new@example.com', 
          password: 'newpassword' 
        })} 
      />
      
      <Button 
        testID="logout-button"
        title="Logout" 
        onPress={() => logout()} 
      />
    </>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('provides authentication state to child components', () => {
    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(getByTestId('auth-status').props.children).toBe('Not Authenticated');
    expect(getByTestId('loading-status').props.children).toBe('Not Loading');
  });

  test('handles login successfully', async () => {
    const { getByTestID } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await act(async () => {
      getByTestID('login-button').props.onPress();
    });

    await waitFor(() => {
      expect(getByTestID('auth-status').props.children).toBe('Authenticated');
      expect(getByTestID('username').props.children).toBe('testuser');
    });

    expect(await AsyncStorage.getItem('userToken')).toBe('fake-token');
  });

  test('handles registration successfully', async () => {
    const { getByTestID } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await act(async () => {
      getByTestID('register-button').props.onPress();
    });

    await waitFor(() => {
      expect(getByTestID('auth-status').props.children).toBe('Authenticated');
      expect(getByTestID('username').props.children).toBe('newuser');
    });

    expect(await AsyncStorage.getItem('userToken')).toBe('new-user-token');
  });

  test('handles logout successfully', async () => {
    await AsyncStorage.setItem('userToken', 'fake-token');
    await AsyncStorage.setItem('userData', JSON.stringify({
      id: 1,
      username: 'testuser',
      email: 'test@example.com'
    }));

    const { getByTestID } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByTestID('auth-status').props.children).toBe('Authenticated');
    });

    await act(async () => {
      getByTestID('logout-button').props.onPress();
    });

    await waitFor(() => {
      expect(getByTestID('auth-status').props.children).toBe('Not Authenticated');
    });

    expect(await AsyncStorage.getItem('userToken')).toBe(null);
  });
}); 