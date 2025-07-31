import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Clock, Building, Trash2, Navigation } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ParkingLocation {
  id: string;
  latitude: number;
  longitude: number;
  address: string;
  timestamp: number;
  floor?: string;  
  notes?: string;  
}
export default function HistoryScreen() {
  const [history, setHistory] = useState<ParkingLocation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const saved = await AsyncStorage.getItem('parkingHistory');
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Ошибка загрузки истории:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteHistoryItem = async (id: string) => {
    Alert.alert(
      'Удалить запись',
      'Вы уверены, что хотите удалить эту запись из истории?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            const updatedHistory = history.filter(item => item.id !== id);
            setHistory(updatedHistory);
            await AsyncStorage.setItem('parkingHistory', JSON.stringify(updatedHistory));
          },
        },
      ]
    );
  };

  const clearAllHistory = async () => {
    Alert.alert(
      'Очистить историю',
      'Вы уверены, что хотите удалить всю историю парковок?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Очистить',
          style: 'destructive',
          onPress: async () => {
            setHistory([]);
            await AsyncStorage.removeItem('parkingHistory');
          },
        },
      ]
    );
  };


 const renderHistoryItem = ({ item }: { item: ParkingLocation }) => (
  <View style={styles.historyItem}>
    <View style={styles.itemHeader}>
      <View style={styles.locationIcon}>
        <MapPin size={20} color="#2563EB" />
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemAddress}>{item.address}</Text>
        <View style={styles.itemMeta}>
          <Clock size={14} color="#6B7280" />
          <Text style={styles.itemTime}>
            {new Date(item.timestamp).toLocaleString('ru-RU')}
          </Text>
        </View>
        {item.floor && (
          <View style={styles.itemMeta}>
            <Building size={14} color="#6B7280" />
            <Text style={styles.itemFloor}>Этаж: {item.floor}</Text>
          </View>
        )}
        {item.notes && (
          <Text style={styles.itemNotes}>{item.notes}</Text>
        )}
      </View>
    </View>
    
    <View style={styles.itemActions}>
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => deleteHistoryItem(item.id)}
      >
        <Trash2 size={16} color="#EF4444" />
      </TouchableOpacity>
    </View>
  </View>
);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Загрузка...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>История парковок</Text>
        <Text style={styles.headerSubtitle}>
          {history.length > 0 ? `${history.length} записей` : 'Нет сохраненных мест'}
        </Text>
      </View>

      {history.length > 0 ? (
        <>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.clearButton} onPress={clearAllHistory}>
              <Trash2 size={16} color="#EF4444" />
              <Text style={styles.clearButtonText}>Очистить всё</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={history}
            renderItem={renderHistoryItem}
            keyExtractor={(item) => item.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <MapPin size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>История пуста</Text>
          <Text style={styles.emptySubtitle}>
            Сохраненные места парковки будут отображаться здесь
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  headerActions: {
    padding: 16,
    alignItems: 'flex-end',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
  },
  clearButtonText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '500',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  historyItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    flex: 1,
    gap: 12,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemAddress: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  itemTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  itemFloor: {
    fontSize: 12,
    color: '#6B7280',
  },
  itemNotes: {
    fontSize: 14,
    color: '#374151',
    marginTop: 4,
    fontStyle: 'italic',
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  navigateAction: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteAction: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
});