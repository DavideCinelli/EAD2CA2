import { itemsApi } from '@/services/api';
import { ItemCreateDTO } from '@/types/api';
import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

const CATEGORIES = [
  'Electronics',
  'Clothing',
  'Jewelry',
  'Documents',
  'Keys',
  'Bags',
  'Books',
  'Sports Equipment',
  'Other'
];

export default function AddItemScreen() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [location, setLocation] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isLost, setIsLost] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAddItem = async () => {
    // Reset error
    setError('');

    // Validate input
    if (!name || !description || !category || !location) {
      setError('Name, description, category, and location are required');
      return;
    }

    setIsLoading(true);

    try {
      // Get current date in ISO format for today
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0] + 'T00:00:00.000Z';

      const newItem: ItemCreateDTO = {
        name: name.trim(),
        description: description.trim(),
        category: category.trim(),
        location: location.trim(),
        date: currentDate,
        isLost,
        isSolved: false,
        imageUrl: imageUrl?.trim() || undefined
      };

      // Log the complete request data
      console.log('Attempting to create item with data:', JSON.stringify(newItem, null, 2));
      
      const result = await itemsApi.create(newItem);
      console.log('Item created successfully:', result);
      
      // Navigate back to the home screen after successfully adding an item
      router.replace('/');
    } catch (err) {
      console.error('Error creating item:', err);
      if (err instanceof Error) {
        setError(err.message || 'Failed to add item. Please try again.');
      } else {
        setError('Failed to add item. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{isLost ? 'Report Lost Item' : 'Report Found Item'}</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Item Status:</Text>
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

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Item Name</Text>
          <TextInput
            style={styles.input}
            placeholder="What is the item?"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe the item (color, size, distinctive features)"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={category}
              onValueChange={(itemValue: string) => setCategory(itemValue)}
              style={styles.picker}
            >
              {CATEGORIES.map((cat) => (
                <Picker.Item key={cat} label={cat} value={cat} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            placeholder="Where was it lost/found?"
            value={location}
            onChangeText={setLocation}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Image URL (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="URL to an image of the item"
            value={imageUrl}
            onChangeText={setImageUrl}
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity 
          style={styles.button} 
          onPress={handleAddItem}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Submit</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
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
  pickerContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  button: {
    backgroundColor: '#4a90e2',
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginBottom: 15,
    textAlign: 'center',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
  },
  statusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
}); 