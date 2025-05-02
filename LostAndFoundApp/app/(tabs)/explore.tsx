import { itemsApi } from '@/services/api';
import { ItemResponseDTO } from '@/types/api';
import { FontAwesome } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from 'expo-router';

type FilterType = 'all' | 'lost' | 'found' | 'solved';

export default function ExploreScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ filter?: FilterType; refresh?: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<ItemResponseDTO[]>([]);
  const [filteredItems, setFilteredItems] = useState<ItemResponseDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);

  // Combined useEffect for all fetch triggers
  useEffect(() => {
    const shouldFetch = params.filter || params.refresh || true;
    if (shouldFetch) {
      if (params.filter) {
        console.log('Setting filter from params:', params.filter);
        setActiveFilter(params.filter as FilterType);
      }
      fetchItems();
    }
  }, [params.filter, params.refresh, navigation]);

  // Separate effect for search filtering
  useEffect(() => {
    if (items.length > 0) {
      applySearchFilter(items);
    }
  }, [searchQuery, items]);

  const applySearchFilter = (itemsToFilter: ItemResponseDTO[]) => {
    if (!itemsToFilter?.length) return;

    let filtered = [...itemsToFilter];
    console.log('Applying search filter, total count:', itemsToFilter.length);

    // Apply search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        item =>
          item.name.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query) ||
          item.location.toLowerCase().includes(query)
      );
      console.log('After search filter, count:', filtered.length);
    }

    setFilteredItems(filtered);
  };

  const fetchItems = async () => {
    try {
      console.log('Fetching items...');
      setIsLoading(true);
      setError('');
      
      // Send the active filter to the API
      console.log('Sending filter to API:', activeFilter);
      
      const fetchedItems = await itemsApi.getAll(activeFilter);
      console.log('Fetched items:', {
        total: fetchedItems.length,
        solved: fetchedItems.filter(i => i.isSolved).length,
        unsolved: fetchedItems.filter(i => !i.isSolved).length,
        lost: fetchedItems.filter(i => i.isLost && !i.isSolved).length,
        found: fetchedItems.filter(i => !i.isLost && !i.isSolved).length
      });

      // Verify items are in correct category based on filter
      const verifiedItems = fetchedItems.filter(item => {
        switch (activeFilter) {
          case 'lost':
            return item.isLost && !item.isSolved;
          case 'found':
            return !item.isLost && !item.isSolved;
          case 'solved':
            return item.isSolved;
          default:
            // For 'all', show unsolved items by default
            return !item.isSolved;
        }
      });
      
      setItems(verifiedItems);
      setFilteredItems(verifiedItems);
    } catch (err) {
      console.error('Error fetching items:', err);
      setError(t('errors.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const renderItem = ({ item }: { item: ItemResponseDTO }) => (
    <TouchableOpacity 
      style={styles.itemCard}
      onPress={() => router.push(`/items/${item.id}`)}
    >
      <View style={styles.cardContent}>
        {item.imageUrl ? (
          <Image 
            source={{ uri: item.imageUrl }}
            style={styles.itemImage}
            contentFit="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>{item.name.charAt(0)}</Text>
          </View>
        )}
        
        <View style={styles.itemDetails}>
          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.itemCategory}>{item.category}</Text>
          <Text style={styles.itemStatus}>
            {item.isLost ? `🔴 ${t('items.lost')}` : `🟢 ${t('items.found')}`} • {item.location}
          </Text>
          <Text style={styles.itemDescription} numberOfLines={2}>
            {item.description}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (!items) return;

    if (text.trim() === '') {
      setFilteredItems(items);
    } else {
      const filtered = items.filter(item =>
        item.name.toLowerCase().includes(text.toLowerCase()) ||
        item.description.toLowerCase().includes(text.toLowerCase()) ||
        item.category.toLowerCase().includes(text.toLowerCase()) ||
        item.location.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredItems(filtered);
    }
  };

  const handleRefresh = async () => {
    console.log('Manual refresh triggered');
    setRefreshing(true);
    await fetchItems();
    setRefreshing(false);
  };

  const handleUpdateAllStates = async () => {
    try {
      setIsLoading(true);
      await itemsApi.updateAllStates();
      // Refresh the items list after update
      await fetchItems();
      Alert.alert(
        t('common.success'),
        t('items.updateAllSuccess'),
        [{ text: t('common.ok') }]
      );
    } catch (err) {
      console.error('Error updating item states:', err);
      Alert.alert(
        t('common.error'),
        t('errors.updateAllFailed'),
        [{ text: t('common.ok') }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>{t('items.allItems')}</Text>
        <TouchableOpacity
          style={styles.updateButton}
          onPress={handleUpdateAllStates}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.updateButtonText}>{t('items.updateAll')}</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <FontAwesome name="search" size={18} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('common.search')}
            value={searchQuery}
            onChangeText={handleSearch}
            clearButtonMode="while-editing"
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <FontAwesome name="times-circle" size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, activeFilter === 'lost' && styles.activeFilter]}
          onPress={() => {
            console.log('Switching to lost filter');
            setActiveFilter(activeFilter === 'lost' ? 'all' : 'lost');
          }}
        >
          <Text style={[styles.filterText, activeFilter === 'lost' && styles.activeFilterText]}>
            {t('items.lost')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, activeFilter === 'found' && styles.activeFilter]}
          onPress={() => {
            console.log('Switching to found filter');
            setActiveFilter(activeFilter === 'found' ? 'all' : 'found');
          }}
        >
          <Text style={[styles.filterText, activeFilter === 'found' && styles.activeFilterText]}>
            {t('items.found')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, activeFilter === 'solved' && styles.activeFilter]}
          onPress={() => {
            console.log('Switching to solved filter');
            setActiveFilter(activeFilter === 'solved' ? 'all' : 'solved');
          }}
        >
          <Text style={[styles.filterText, activeFilter === 'solved' && styles.activeFilterText]}>
            {t('items.solved')}
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a90e2" />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchItems}>
            <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : filteredItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {searchQuery.trim() !== '' ? t('items.noSearchResults') : t('items.noItemsFound')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  searchBox: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 50,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  listContainer: {
    padding: 15,
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
  },
  placeholderImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ccc',
    textTransform: 'uppercase',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 14,
    color: '#4a90e2',
    fontWeight: '500',
    marginBottom: 4,
  },
  itemStatus: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#4a90e2',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 4,
    marginHorizontal: 20,
    marginBottom: 15,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  activeFilter: {
    backgroundColor: '#4a90e2',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#fff',
  },
  updateButton: {
    backgroundColor: '#4a90e2',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 10,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
