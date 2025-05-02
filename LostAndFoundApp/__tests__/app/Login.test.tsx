import LoginScreen from '@/app/auth/login';
import { AuthProvider } from '@/context/AuthContext';
import { fireEvent, render } from '@testing-library/react-native';

jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
  },
}));

jest.mock('@/context/AuthContext', () => {
  const originalModule = jest.requireActual('@/context/AuthContext');
  
  return {
    ...originalModule,
    useAuth: () => ({
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
      isLoading: false,
    }),
  };
});

describe('LoginScreen', () => {
  test('renders login form correctly', () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    
    expect(getByPlaceholderText('Username')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
    
    expect(getByText('Sign In')).toBeTruthy();
    
    expect(getByText('Register')).toBeTruthy();
  });

  test('shows error when form is submitted with empty fields', () => {
    const { getByText } = render(<LoginScreen />);
    
    fireEvent.press(getByText('Sign In'));
    
    expect(getByText('Username and password are required')).toBeTruthy();
  });

  test('calls login function with entered credentials', async () => {
    const { getByPlaceholderText, getByText } = render(
      <AuthProvider>
        <LoginScreen />
      </AuthProvider>
    );
    
    fireEvent.changeText(getByPlaceholderText('Username'), 'testuser');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password');
    
    fireEvent.press(getByText('Sign In'));
    
  });
}); 