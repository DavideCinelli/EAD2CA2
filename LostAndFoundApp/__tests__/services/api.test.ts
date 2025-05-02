import { itemsApi } from '@/services/api';
import { ItemCreateDTO, ItemResponseDTO } from '@/types/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

global.fetch = jest.fn();

describe('Item API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.clear();
  });

  describe('getAll', () => {
    test('fetches all items successfully', async () => {
      const mockItems: ItemResponseDTO[] = [
        {
          id: 1,
          name: 'Test Item 1',
          description: 'Description 1',
          category: 'Electronics',
          location: 'Location 1',
          date: '2025-05-02',
          isLost: true,
          isSolved: false,
          userId: 1,
          username: 'user1'
        },
        {
          id: 2,
          name: 'Test Item 2',
          description: 'Description 2',
          category: 'Clothing',
          location: 'Location 2',
          date: '2025-05-01',
          isLost: false,
          isSolved: false,
          userId: 2,
          username: 'user2'
        }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockItems),
        status: 200,
        statusText: 'OK'
      });

      const result = await itemsApi.getAll();
      
      expect(result).toEqual(mockItems);
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    test('handles API error correctly', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        text: jest.fn().mockResolvedValueOnce('Server error'),
        status: 500,
        statusText: 'Internal Server Error'
      });

      await expect(itemsApi.getAll()).rejects.toThrow('Failed to fetch items');
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    test('filters items correctly by lost status', async () => {
      const mockItems: ItemResponseDTO[] = [
        {
          id: 1,
          name: 'Lost Item',
          description: 'Description',
          category: 'Electronics',
          location: 'Location',
          date: '2025-05-02',
          isLost: true,
          isSolved: false,
          userId: 1,
          username: 'user1'
        },
        {
          id: 2,
          name: 'Found Item',
          description: 'Description',
          category: 'Clothing',
          location: 'Location',
          date: '2025-05-01',
          isLost: false,
          isSolved: false,
          userId: 2,
          username: 'user2'
        }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockItems),
        status: 200,
        statusText: 'OK'
      });

      const result = await itemsApi.getAll('lost');
      
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('?filter=lost'),
        expect.anything()
      );
    });
  });

  describe('getById', () => {
    test('fetches an item by ID successfully', async () => {
      const mockItem: ItemResponseDTO = {
        id: 1,
        name: 'Test Item',
        description: 'Description',
        category: 'Electronics',
        location: 'Location',
        date: '2025-05-02',
        isLost: true,
        isSolved: false,
        userId: 1,
        username: 'user1'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockItem),
        status: 200,
        statusText: 'OK'
      });

      const result = await itemsApi.getById(1);
      
      expect(result).toEqual(mockItem);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/Items/1'),
        expect.anything()
      );
    });
  });

  describe('create', () => {
    test('creates an item successfully', async () => {
      const newItem: ItemCreateDTO = {
        name: 'New Item',
        description: 'New Description',
        category: 'Electronics',
        location: 'New Location',
        date: '2025-05-02',
        isLost: true,
        isSolved: false
      };

      const createdItem: ItemResponseDTO = {
        id: 3,
        name: 'New Item',
        description: 'New Description',
        category: 'Electronics',
        location: 'New Location',
        date: '2025-05-02',
        isLost: true,
        isSolved: false,
        userId: 1,
        username: 'user1'
      };

      await AsyncStorage.setItem('userToken', 'mock-token');

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: jest.fn().mockResolvedValueOnce(JSON.stringify(createdItem)),
        status: 201,
        statusText: 'Created'
      });

      const result = await itemsApi.create(newItem);
      
      expect(result).toEqual(createdItem);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          }),
          body: JSON.stringify(newItem)
        })
      );
    });
  });
}); 