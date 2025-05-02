import { ThemedText } from '@/components/ThemedText';
import { render } from '@testing-library/react-native';

describe('ThemedText Component', () => {
  test('renders correctly with default type', () => {
    const { getByText } = render(<ThemedText>Hello World</ThemedText>);
    expect(getByText('Hello World')).toBeTruthy();
  });

  test('renders correctly with title type', () => {
    const { getByText } = render(<ThemedText type="title">Title Text</ThemedText>);
    expect(getByText('Title Text')).toBeTruthy();
  });

  test('renders correctly with subtitle type', () => {
    const { getByText } = render(<ThemedText type="subtitle">Subtitle Text</ThemedText>);
    expect(getByText('Subtitle Text')).toBeTruthy();
  });

  test('renders correctly with link type', () => {
    const { getByText } = render(<ThemedText type="link">Link Text</ThemedText>);
    expect(getByText('Link Text')).toBeTruthy();
  });

  test('applies custom style', () => {
    const { getByText } = render(
      <ThemedText style={{ color: 'red' }}>Custom Style</ThemedText>
    );
    const textElement = getByText('Custom Style');
    expect(textElement).toBeTruthy();

  });
}); 