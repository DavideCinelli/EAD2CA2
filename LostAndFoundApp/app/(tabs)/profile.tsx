import { useAuth } from '@/context/AuthContext';
import { itemsApi } from '@/services/api';
import { ItemResponseDTO } from '@/types/api';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [userItems, setUserItems] = useState<ItemResponseDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { t, i18n } = useTranslation();
  const iconColor = useThemeColor({}, 'text');

  useEffect(() => {
    fetchUserItems();
  }, []);

  const fetchUserItems = async () => {
    try {
      setIsLoading(true);
      const allItems = await itemsApi.getAll();
      // Filter items that belong to the current user
      const items = allItems.filter(item => user && item.userId === Number(user.id));
      setUserItems(items);
    } catch (err) {
      setError(t('errors.loadFailed'));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    Alert.alert(
      t('common.delete'),
      t('common.confirmDelete'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.delete'), 
          style: 'destructive',
          onPress: async () => {
            try {
              await itemsApi.delete(itemId);
              setUserItems(userItems.filter(item => item.id !== itemId));
            } catch (err) {
              Alert.alert(t('errors.deleteFailed'));
            }
          }
        }
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      t('common.logout'),
      t('common.confirmLogout'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.logout'), 
          onPress: async () => {
            await logout();
            router.replace('/auth/login');
          }
        }
      ]
    );
  };

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' }
  ];

  const changeLanguage = async (langCode: string) => {
    await i18n.changeLanguage(langCode);
  };

  // Render each item in the list
  const renderItem = ({ item }: { item: ItemResponseDTO }) => (
    <View style={styles.itemCard}>
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
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemCategory}>
          {t(`items.categories.${item.category.toLowerCase()}`, { defaultValue: item.category })}
        </Text>
        <Text style={styles.itemStatus} numberOfLines={1}>
          {item.isLost ? `🔴 ${t('items.lost')}` : `🟢 ${t('items.found')}`} • {item.location}
        </Text>
        <Text style={styles.itemDate}>
          {new Date(item.date).toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.itemActions}>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => router.push(`/items/${item.id}`)}
        >
          <Text style={styles.editButtonText}>{t('common.edit')}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDeleteItem(item.id)}
        >
          <Text style={styles.deleteButtonText}>{t('common.delete')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>{t('common.profile')}</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>{t('common.logout')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.userInfo}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.username.charAt(0)}</Text>
        </View>
        <Text style={styles.username}>{user?.username}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.itemsContainer}>
        <Text style={styles.sectionTitle}>{t('common.yourItems')}</Text>
        
        {isLoading ? (
          <ActivityIndicator size="large" color="#4a90e2" />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : userItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>{t('common.noItemsYet')}</Text>
            <TouchableOpacity 
              style={styles.addItemButton}
              onPress={() => router.push('/add-item')}
            >
              <View style={styles.addItemButtonContent}>
                <FontAwesome name="plus-circle" size={20} color="#fff" />
                <Text style={styles.addItemButtonText}>{t('common.addItem')}</Text>
              </View>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={userItems}
            renderItem={renderItem}
            keyExtractor={item => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>{t('common.language')}</ThemedText>
        
        {/* Language Selection */}
        <View style={styles.languageSection}>
          {languages.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.languageButton,
                i18n.language === lang.code && styles.selectedLanguage
              ]}
              onPress={() => changeLanguage(lang.code)}
            >
              <ThemedText style={styles.languageText}>{lang.name}</ThemedText>
              {i18n.language === lang.code && (
                <Ionicons name="checkmark" size={24} color={iconColor} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  logoutButton: {
    padding: 10,
  },
  logoutText: {
    color: '#ff3b30',
    fontSize: 16,
    fontWeight: '600',
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  email: {
    fontSize: 16,
    color: '#666',
  },
  itemsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  listContent: {
    paddingBottom: 20,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  itemImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 15,
  },
  placeholderImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#999',
    textTransform: 'uppercase',
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  itemCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  itemStatus: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  itemDate: {
    fontSize: 12,
    color: '#999',
  },
  itemActions: {
    marginLeft: 10,
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: '#4a90e2',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginBottom: 8,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#ff3b30',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  addItemButton: {
    backgroundColor: '#4a90e2',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
  },
  addItemButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addItemButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  languageSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 4,
    backgroundColor: '#f5f5f5',
  },
  selectedLanguage: {
    backgroundColor: '#e8f0fe',
    borderWidth: 1,
    borderColor: '#4a90e2',
  },
  languageText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
}); 