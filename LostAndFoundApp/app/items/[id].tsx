import { useAuth } from '@/context/AuthContext';
import { itemsApi } from '@/services/api';
import { ItemResponseDTO, ItemUpdateDTO } from '@/types/api';
import { FontAwesome } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ItemDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<ItemResponseDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  // Edit form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isLost, setIsLost] = useState(true);
  const [isSolved, setIsSolved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [date, setDate] = useState('');

  useEffect(() => {
    if (id) {
      fetchItem(id);
    }
  }, [id]);

  const fetchItem = async (itemId: string) => {
    try {
      setIsLoading(true);
      const fetchedItem = await itemsApi.getById(parseInt(itemId));
      setItem(fetchedItem);
      
      // Initialize form fields
      setName(fetchedItem.name);
      setDescription(fetchedItem.description);
      setCategory(fetchedItem.category);
      setLocation(fetchedItem.location);
      setImageUrl(fetchedItem.imageUrl || '');
      setIsLost(fetchedItem.isLost);
      setIsSolved(fetchedItem.isSolved);
      setDate(fetchedItem.date);
    } catch (err) {
      setError(t('errors.loadFailed'));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!id || !item) return;

    // Validate input
    if (!name || !description || !category || !location) {
      Alert.alert(t('common.error'), t('errors.requiredFields'));
      return;
    }

    setIsSaving(true);

    const updatedItem: ItemUpdateDTO = {
      name,
      description,
      category,
      location,
      isLost,
      isSolved,
      imageUrl: imageUrl || undefined,
    };

    try {
      const response = await itemsApi.update(parseInt(id), updatedItem);
      setItem(response);
      setIsEditing(false);
      Alert.alert(t('common.success'), t('items.saveSuccess'));
    } catch (err) {
      Alert.alert(t('common.error'), t('errors.saveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!id) return;

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
              setIsLoading(true);
              await itemsApi.delete(parseInt(id));
              Alert.alert(t('common.success'), t('items.deleteSuccess'), [
                { text: t('common.ok'), onPress: () => router.replace('/') }
              ]);
            } catch (err) {
              Alert.alert(t('common.error'), t('errors.deleteFailed'));
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleMarkAsSolved = async () => {
    if (!id || !item) return;

    try {
      setIsSaving(true);
      console.log('Marking item as solved:', id);
      
      // Use the regular update endpoint with just the isSolved field
      const updateData: ItemUpdateDTO = {
        isSolved: true
      };

      console.log('Sending update request:', updateData);
      
      // Make the API call using the regular update endpoint
      const updatedItem = await itemsApi.update(parseInt(id), updateData);
      console.log('Item marked as solved successfully:', updatedItem);
      
      // Update local state
      setItem(updatedItem);
      setIsSolved(updatedItem.isSolved);

      // Show success message and navigate
      Alert.alert(
        t('common.success'),
        t('items.markedAsSolved'),
        [
          {
            text: t('common.ok'),
            onPress: () => {
              router.replace('/(tabs)');
              router.push({
                pathname: '/explore',
                params: { 
                  filter: 'solved',
                  refresh: Date.now().toString()
                }
              });
            }
          }
        ]
      );
    } catch (err) {
      console.error('Error marking item as solved:', err);
      Alert.alert(
        t('common.error'),
        t('errors.markAsSolvedFailed'),
        [{ text: t('common.ok') }]
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!item) {
      setError(t('errors.itemNotFound'));
      return;
    }

    try {
      setIsUpdating(true);
      setError('');

      const updateData: ItemUpdateDTO = {
        name: name.trim(),
        description: description.trim(),
        category: category.trim(),
        location: location.trim(),
        date: date,
        isLost: isLost,
        isSolved: isSolved,
        imageUrl: imageUrl?.trim() || undefined
      };

      console.log('Updating item with data:', updateData);
      
      // Update the item
      const updatedItem = await itemsApi.update(item.id, updateData);
      
      // Verify the update was successful
      if (updatedItem.isSolved !== updateData.isSolved) {
        throw new Error('Failed to update item status');
      }
      
      // Update local state
      setItem(updatedItem);
      
      // Show success message
      Alert.alert(
        t('common.success'),
        t('items.updateSuccess'),
        [{ text: t('common.ok') }]
      );

      // Navigate back
      router.back();
    } catch (err) {
      console.error('Error updating item:', err);
      setError(t('errors.updateFailed'));
      
      // Reset status if update failed
      if (item) {
        setIsSolved(item.isSolved);
        setIsLost(item.isLost);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  // Check if current user is the owner of the item
  const isOwner = item && user && item.userId === Number(user.id);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#4a90e2" />
      </View>
    );
  }

  if (error || !item) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar style="dark" />
        <Text style={styles.errorText}>{error || 'Item not found'}</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <FontAwesome name="arrow-left" size={20} color="#333" />
        </TouchableOpacity>
        
        <Text style={styles.title}>
          {isEditing ? t('items.editItem') : t('items.itemDetails')}
        </Text>
        
        {isOwner && !isEditing && (
          <TouchableOpacity 
            style={styles.editButton} 
            onPress={() => setIsEditing(true)}
          >
            <FontAwesome name="pencil" size={20} color="#4a90e2" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Item Image */}
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

        {/* Status Badge */}
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusBadge,
            {
              backgroundColor: item.isSolved 
                ? '#e3f2fd' 
                : item.isLost 
                  ? '#ffebee' 
                  : '#e8f5e9',
              borderColor: item.isSolved 
                ? '#1976d2' 
                : item.isLost 
                  ? '#d32f2f' 
                  : '#2e7d32',
            }
          ]}>
            <FontAwesome 
              name={item.isSolved 
                ? 'check-circle' 
                : item.isLost 
                  ? 'exclamation-circle' 
                  : 'check-circle'} 
              size={16} 
              color={item.isSolved 
                ? '#1976d2' 
                : item.isLost 
                  ? '#d32f2f' 
                  : '#2e7d32'} 
            />
            <Text style={[
              styles.statusText,
              { color: item.isSolved 
                ? '#1976d2' 
                : item.isLost 
                  ? '#d32f2f' 
                  : '#2e7d32' }
            ]}>
              {(() => {
                const statusKey = item.isSolved ? 'items.solved' : item.isLost ? 'items.lost' : 'items.found';
                return t(statusKey);
              })()}
            </Text>
          </View>

          {/* Mark as Solved Button - Only show if not already solved */}
          {!item.isSolved && (
            <TouchableOpacity 
              style={styles.solveButton}
              onPress={() => {
                console.log('Solve button pressed');
                console.log('Current item:', item);
                console.log('Current user:', user);
                handleMarkAsSolved();
              }}
              disabled={isSaving}
            >
              <FontAwesome name="check-circle" size={16} color="#fff" />
              {isSaving ? (
                <ActivityIndicator color="#fff" style={{ marginLeft: 8 }} />
              ) : (
                <Text style={styles.solveButtonText}>
                  {t('items.markAsSolved')}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {isEditing ? (
          // Edit Form
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('items.itemName')}</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder={t('items.whatIsItem')}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('items.description')}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder={t('items.describeItem')}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('items.category')}</Text>
              <TextInput
                style={styles.input}
                value={category}
                onChangeText={setCategory}
                placeholder={t('items.selectCategory')}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('items.location')}</Text>
              <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder={t('items.whereItem')}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('items.imageUrl')}</Text>
              <TextInput
                style={styles.input}
                value={imageUrl}
                onChangeText={setImageUrl}
                placeholder={t('items.imageUrlHint')}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.switchContainer}>
              <Text style={styles.label}>{t('items.itemStatus')}:</Text>
              <View style={styles.statusToggle}>
                <Text style={{ color: isLost ? '#4a90e2' : '#666' }}>{t('items.lost')}</Text>
                <Switch
                  value={!isLost}
                  onValueChange={(value) => setIsLost(!value)}
                  trackColor={{ false: '#4a90e2', true: '#5cb85c' }}
                  thumbColor="#fff"
                  ios_backgroundColor="#4a90e2"
                />
                <Text style={{ color: !isLost ? '#5cb85c' : '#666' }}>{t('items.found')}</Text>
              </View>
            </View>

            <View style={styles.switchContainer}>
              <Text style={styles.label}>{t('items.solved')}:</Text>
              <View style={styles.statusToggle}>
                <Text style={{ color: !isSolved ? '#666' : '#1976d2' }}>{t('common.no')}</Text>
                <Switch
                  value={isSolved}
                  onValueChange={(value) => setIsSolved(value)}
                  trackColor={{ false: '#e0e0e0', true: '#1976d2' }}
                  thumbColor="#fff"
                  ios_backgroundColor="#e0e0e0"
                />
                <Text style={{ color: isSolved ? '#1976d2' : '#666' }}>{t('common.yes')}</Text>
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]} 
                onPress={() => setIsEditing(false)}
                disabled={isSaving}
              >
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.saveButton]} 
                onPress={handleUpdate}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>{t('common.save')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // View Mode
          <View style={styles.detailsContainer}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemCategory}>{item.category}</Text>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('items.description')}</Text>
              <Text style={styles.sectionContent}>{item.description}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('items.location')}</Text>
              <Text style={styles.sectionContent}>{item.location}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('items.date')}</Text>
              <Text style={styles.sectionContent}>
                {new Date(item.date).toLocaleDateString()}
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('items.postedBy')}</Text>
              <Text style={styles.sectionContent}>{item.username}</Text>
            </View>

            {isOwner && !isEditing && !item.isSolved && (
              <View style={styles.ownerActions}>
                <TouchableOpacity 
                  style={[styles.button, styles.deleteButton]} 
                  onPress={handleDelete}
                >
                  <Text style={styles.deleteButtonText}>{t('common.delete')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    marginBottom: 20,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#333',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  editButton: {
    padding: 10,
  },
  editButtonText: {
    fontSize: 16,
    color: '#4a90e2',
  },
  itemImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#f5f5f5',
  },
  placeholderImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 60,
    color: '#fff',
    fontWeight: 'bold',
  },
  formContainer: {
    padding: 20,
  },
  detailsContainer: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  saveButton: {
    backgroundColor: '#4a90e2',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  itemName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  itemCategory: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  sectionContent: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  ownerActions: {
    marginTop: 30,
  },
  solveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  solveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
}); 