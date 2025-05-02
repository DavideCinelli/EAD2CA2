import { ItemResponseDTO } from '@/types/api';
import { FontAwesome } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

interface ItemCardProps {
  item: ItemResponseDTO;
  onRefresh?: () => void;
}

export function ItemCard({ item, onRefresh }: ItemCardProps) {
  const { t } = useTranslation();

  return (
    <Link href={`/items/${item.id}`} asChild>
      <TouchableOpacity style={styles.card} onPress={() => {}}>
        {/* Item Image */}
        {item.imageUrl ? (
          <Image 
            source={{ uri: item.imageUrl }}
            style={styles.image}
            contentFit="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>{item.name.charAt(0)}</Text>
          </View>
        )}

        {/* Item Details */}
        <View style={styles.details}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1}>{item.name}</Text>
            <View style={[
              styles.badge,
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
                size={12} 
                color={item.isSolved 
                  ? '#1976d2' 
                  : item.isLost 
                    ? '#d32f2f' 
                    : '#2e7d32'} 
              />
              <Text style={[
                styles.badgeText,
                { color: item.isSolved 
                  ? '#1976d2' 
                  : item.isLost 
                    ? '#d32f2f' 
                    : '#2e7d32' }
              ]}>
                {item.isSolved ? t('items.solved') : item.isLost ? t('items.lost') : t('items.found')}
              </Text>
            </View>
          </View>

          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>

          <View style={styles.footer}>
            <View style={styles.footerItem}>
              <FontAwesome name="map-marker" size={12} color="#666" />
              <Text style={styles.footerText} numberOfLines={1}>
                {item.location}
              </Text>
            </View>
            <View style={styles.footerItem}>
              <FontAwesome name="calendar" size={12} color="#666" />
              <Text style={styles.footerText}>
                {new Date(item.date).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  placeholderImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
  },
  details: {
    flex: 1,
    marginLeft: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
}); 