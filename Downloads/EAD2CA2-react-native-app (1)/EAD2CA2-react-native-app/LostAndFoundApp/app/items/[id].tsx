import { useAuth } from '@/context/AuthContext';
import { itemsApi } from '@/services/api';
import { ItemResponseDTO, ItemUpdateDTO } from '@/types/api';
import { FontAwesome } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ItemDetailScreen() {
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

  useEffect(() => {
    if (id) {
      fetchItem(id);
    }
  }, [id]);

  const fetchItem = async (itemId: string) => {
    try {
      setIsLoading(true);
      const numericId = parseInt(itemId, 10);
      const fetchedItem = await itemsApi.getById(numericId);
      setItem(fetchedItem);
      
      // Initialize form fields
      setName(fetchedItem.name);
      setDescription(fetchedItem.description);
      setCategory(fetchedItem.category);
      setLocation(fetchedItem.location);
      setImageUrl(fetchedItem.imageUrl || '');
      setIsLost(fetchedItem.isLost);
      setIsSolved(fetchedItem.isSolved);
    } catch (err) {
      setError('Failed to load item details');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!id || !item) return;

    // Validate input
    if (!name || !description || !category || !location) {
      Alert.alert('Error', 'Name, description, category, and location are required');
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
      Alert.alert('Success', 'Item updated successfully');
    } catch (err) {
      Alert.alert('Error', 'Failed to update item');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!id) return;

    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await itemsApi.delete(parseInt(id));
              Alert.alert('Success', 'Item deleted successfully', [
                { text: 'OK', onPress: () => router.replace('/') }
              ]);
            } catch (err) {
              Alert.alert('Error', 'Failed to delete item');
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleMarkAsSolved = async () => {
    console.log('handleMarkAsSolved called');
    if (!id || !item) {
      console.log('Missing id or item:', { id, item });
      return;
    }

    console.log('Showing alert dialog');
    Alert.alert(
      'Mark as Solved',
      'Are you sure you want to mark this item as solved?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Mark as Solved', 
          onPress: async () => {
            console.log('Alert confirmed, starting update');
            try {
              setIsSaving(true);
              const updatedItem: ItemUpdateDTO = {
                name: item.name,
                description: item.description,
                category: item.category,
                location: item.location,
                isLost: item.isLost,
                isSolved: true,
                imageUrl: item.imageUrl
              };
              
              const numericId = parseInt(id, 10);
              console.log('Marking item as solved:', numericId);
              const response = await itemsApi.update(numericId, updatedItem);
              console.log('Server response:', response);
              
              if (response) {
                // Update local state with the response from the server
                setItem(response);
                setIsSolved(response.isSolved);
                Alert.alert('Success', 'Item marked as solved');
              } else {
                throw new Error('No response received from server');
              }
            } catch (err) {
              console.error('Error marking item as solved:', err);
              Alert.alert('Error', 'Failed to mark item as solved');
            } finally {
              setIsSaving(false);
            }
          }
        }
      ]
    );
  };

  // Check if current user is the owner of the item
  const isOwner = item && user && item.userId === parseInt(user.id);

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
          {isEditing ? 'Edit Item' : 'Item Details'}
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
              {item.isSolved ? 'Solved' : item.isLost ? 'Lost' : 'Found'}
            </Text>
          </View>

          {/* Mark as Solved Button - Available to all users */}
          {!item.isSolved && user && (
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
              <Text style={styles.solveButtonText}>
                {isSaving ? 'Marking as Solved...' : 'Mark as Solved'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {isEditing ? (
          // Edit Form
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="What is the item?"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe the item (color, size, distinctive features)"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Category</Text>
              <TextInput
                style={styles.input}
                value={category}
                onChangeText={setCategory}
                placeholder="What category does it belong to?"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Location</Text>
              <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder="Where was it lost/found?"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Image URL (Optional)</Text>
              <TextInput
                style={styles.input}
                value={imageUrl}
                onChangeText={setImageUrl}
                placeholder="https://example.com/image.jpg"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.switchContainer}>
              <Text style={styles.label}>Item Status:</Text>
              <View style={styles.statusToggle}>
                <Text style={{ color: isLost ? '#4a90e2' : '#666' }}>Lost</Text>
                <Switch
                  value={!isLost}
                  onValueChange={(value) => setIsLost(!value)}
                  trackColor={{ false: '#4a90e2', true: '#5cb85c' }}
                  thumbColor="#fff"
                  ios_backgroundColor="#4a90e2"
                />
                <Text style={{ color: !isLost ? '#5cb85c' : '#666' }}>Found</Text>
              </View>
            </View>

            <View style={styles.switchContainer}>
              <Text style={styles.label}>Solved:</Text>
              <View style={styles.statusToggle}>
                <Text style={{ color: !isSolved ? '#666' : '#1976d2' }}>No</Text>
                <Switch
                  value={isSolved}
                  onValueChange={(value) => setIsSolved(value)}
                  trackColor={{ false: '#e0e0e0', true: '#1976d2' }}
                  thumbColor="#fff"
                  ios_backgroundColor="#e0e0e0"
                />
                <Text style={{ color: isSolved ? '#1976d2' : '#666' }}>Yes</Text>
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]} 
                onPress={() => setIsEditing(false)}
                disabled={isSaving}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.saveButton]} 
                onPress={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
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
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.sectionContent}>{item.description}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location</Text>
              <Text style={styles.sectionContent}>{item.location}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Date</Text>
              <Text style={styles.sectionContent}>
                {new Date(item.date).toLocaleDateString()}
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Posted By</Text>
              <Text style={styles.sectionContent}>{item.username}</Text>
            </View>

            {isOwner && !isEditing && !item.isSolved && (
              <View style={styles.ownerActions}>
                <TouchableOpacity 
                  style={[styles.button, styles.deleteButton]} 
                  onPress={handleDelete}
                >
                  <Text style={styles.deleteButtonText}>Delete Item</Text>
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