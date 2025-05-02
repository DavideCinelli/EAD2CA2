import NotFoundScreen from '@/app/+not-found';
import { render } from '@testing-library/react-native';

describe('NotFoundScreen', () => {
  test('renders correctly', () => {
    const { getByText } = render(<NotFoundScreen />);
    
    expect(getByText('This screen does not exist.')).toBeTruthy();
    
    expect(getByText('Go to home screen!')).toBeTruthy();
  });
}); 