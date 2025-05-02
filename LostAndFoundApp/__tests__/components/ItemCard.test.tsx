import { ItemCard } from '@/components/ItemCard';
import { ItemResponseDTO } from '@/types/api';
import { render } from '@testing-library/react-native';

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  router: {
    push: jest.fn(),
  },
}));

describe('ItemCard Component', () => {
  const mockItem: ItemResponseDTO = {
    id: 1,
    name: 'Test Item',
    description: 'This is a test item description',
    category: 'Electronics',
    location: 'Test Location',
    date: '2025-05-02',
    isLost: true,
    isSolved: false,
    imageUrl: 'https://example.com/image.jpg',
    userId: 1,
    username: 'testuser'
  };

  const mockRefresh = jest.fn();

  test('renders correctly with all item details', () => {
    const { getByText } = render(
      <ItemCard item={mockItem} onRefresh={mockRefresh} />
    );
    
    expect(getByText('Test Item')).toBeTruthy();
    expect(getByText('This is a test item description')).toBeTruthy();
    expect(getByText('Electronics')).toBeTruthy();
    expect(getByText('Test Location')).toBeTruthy();
  });

  test('shows "Lost" badge for lost items', () => {
    const lostItem = { ...mockItem, isLost: true };
    const { getByText } = render(
      <ItemCard item={lostItem} onRefresh={mockRefresh} />
    );
    
    expect(getByText('Lost')).toBeTruthy();
  });

  test('shows "Found" badge for found items', () => {
    const foundItem = { ...mockItem, isLost: false };
    const { getByText } = render(
      <ItemCard item={foundItem} onRefresh={mockRefresh} />
    );
    
    expect(getByText('Found')).toBeTruthy();
  });

  test('shows "Solved" badge for solved items', () => {
    const solvedItem = { ...mockItem, isSolved: true };
    const { getByText } = render(
      <ItemCard item={solvedItem} onRefresh={mockRefresh} />
    );
    
    expect(getByText('Solved')).toBeTruthy();
  });

  test('shows placeholder when no image is provided', () => {
    const itemWithoutImage = { ...mockItem, imageUrl: undefined };
    const { getByText } = render(
      <ItemCard item={itemWithoutImage} onRefresh={mockRefresh} />
    );
    
    expect(getByText('T')).toBeTruthy();
  });
}); 