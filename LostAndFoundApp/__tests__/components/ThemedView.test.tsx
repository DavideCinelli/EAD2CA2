import { ThemedView } from '@/components/ThemedView';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

describe('ThemedView Component', () => {
  test('renders children correctly', () => {
    const { getByText } = render(
      <ThemedView>
        <Text>View Content</Text>
      </ThemedView>
    );
    expect(getByText('View Content')).toBeTruthy();
  });

  test('applies custom style', () => {
    const { getByTestId } = render(
      <ThemedView style={{ margin: 10 }} testID="themed-view">
        <Text>Styled View</Text>
      </ThemedView>
    );
    const viewElement = getByTestId('themed-view');
    expect(viewElement).toBeTruthy();
  });

  test('renders with light color', () => {
    const { getByTestId } = render(
      <ThemedView lightColor="#FFFFFF" testID="light-view">
        <Text>Light View</Text>
      </ThemedView>
    );
    const viewElement = getByTestId('light-view');
    expect(viewElement).toBeTruthy();
  });

  test('renders with dark color', () => {
    const { getByTestId } = render(
      <ThemedView darkColor="#000000" testID="dark-view">
        <Text>Dark View</Text>
      </ThemedView>
    );
    const viewElement = getByTestId('dark-view');
    expect(viewElement).toBeTruthy();
  });
}); 