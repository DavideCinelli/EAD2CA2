import { useAuth } from '@/context/AuthContext';
import { itemsApi } from '@/services/api';
import { ItemResponseDTO } from '@/types/api';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ItemCard } from '@/components/ItemCard';

type FilterType = 'lost' | 'found' | 'solved';

export default function ItemsScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState<ItemResponseDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('lost');

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setIsLoading(true);
      const allItems = await itemsApi.getAll();
      setItems(allItems);
    } catch (err) {
      console.error('Error loading items:', err);
      setError('Failed to load items');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4a90e2" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  // Filter items based on the active filter
  const filteredItems = items.filter(item => {
    switch (activeFilter) {
      case 'lost':
        return item.isLost && !item.isSolved;
      case 'found':
        return !item.isLost && !item.isSolved;
      case 'solved':
        return item.isSolved;
      default:
        return true;
    }
  });

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.sectionTitle}>Active Items</Text>
      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[
            styles.filterTab,
            activeFilter === 'lost' && styles.activeFilterTab
          ]}
          onPress={() => setActiveFilter('lost')}
        >
          <FontAwesome 
            name="exclamation-circle" 
            size={14} 
            color={activeFilter === 'lost' ? '#fff' : '#666'} 
          />
          <Text style={[
            styles.filterText,
            activeFilter === 'lost' && styles.activeFilterText
          ]}>Lost</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.filterTab,
            activeFilter === 'found' && styles.activeFilterTab
          ]}
          onPress={() => setActiveFilter('found')}
        >
          <FontAwesome 
            name="check-circle" 
            size={14} 
            color={activeFilter === 'found' ? '#fff' : '#666'} 
          />
          <Text style={[
            styles.filterText,
            activeFilter === 'found' && styles.activeFilterText
          ]}>Found</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.filterTab,
            activeFilter === 'solved' && styles.activeFilterTab
          ]}
          onPress={() => setActiveFilter('solved')}
        >
          <FontAwesome 
            name="check-circle" 
            size={14} 
            color={activeFilter === 'solved' ? '#fff' : '#666'} 
          />
          <Text style={[
            styles.filterText,
            activeFilter === 'solved' && styles.activeFilterText
          ]}>Solved</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredItems}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <ItemCard item={item} onRefresh={loadItems} />
        )}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={isLoading}
        onRefresh={loadItems}
        ListEmptyComponent={
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>
              No {activeFilter} items found
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  listContent: {
    padding: 16,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  headerContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    padding: 4,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginHorizontal: 2,
  },
  activeFilterTab: {
    backgroundColor: '#4a90e2',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  activeFilterText: {
    color: '#fff',
    fontWeight: '500',
  },
});
