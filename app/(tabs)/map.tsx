import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  Modal,
  TextInput,
} from 'react-native';
import * as Location from 'expo-location';
import * as Linking from 'expo-linking';
import { MapPin, Navigation, Car, RefreshCw, Save, X } from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

interface ParkingLocation {
  id: string;
  latitude: number;
  longitude: number;
  address: string;
  timestamp: number;
  floor?: string;
  notes?: string;
}

export default function MapScreen() {
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [carLocation, setCarLocation] = useState<ParkingLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [floor, setFloor] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    initializeLocation();
    loadCarLocation();
  }, []);

  const initializeLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setLocationPermission(false);
        setLoading(false);
        Alert.alert(
          'Разрешение на местоположение',
          'Для работы карты необходимо разрешение на доступ к местоположению'
        );
        return;
      }

      setLocationPermission(true);
      await getCurrentLocation();
    } catch (error) {
      console.error('Ошибка инициализации местоположения:', error);
      setLoading(false);
    }
  };

  const loadCarLocation = async () => {
    try {
      const saved = await AsyncStorage.getItem('parkingHistory');
      if (saved) {
        const history = JSON.parse(saved);
        if (history.length > 0) {
          setCarLocation(history[0]);
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки местоположения автомобиля:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      setIsLocating(true);
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      console.error('Ошибка получения местоположения:', error);
      Alert.alert('Ошибка', 'Не удалось получить текущее местоположение');
    } finally {
      setIsLocating(false);
      setLoading(false);
    }
  };

  const saveParkingLocation = async () => {
    if (!userLocation) return;

    try {
      const address = await getAddressFromCoordinates(userLocation.latitude, userLocation.longitude);
      
      const newLocation: ParkingLocation = {
        id: Date.now().toString(),
        ...userLocation,
        address,
        timestamp: Date.now(),
        floor: floor || undefined,
        notes: notes || undefined,
      };

      const history = await AsyncStorage.getItem('parkingHistory');
      const historyArray = history ? JSON.parse(history) : [];
      const updatedHistory = [newLocation, ...historyArray];
      await AsyncStorage.setItem('parkingHistory', JSON.stringify(updatedHistory));

      setCarLocation(newLocation);
      setShowSaveModal(false);
      setFloor('');
      setNotes('');
      
      Alert.alert('Успешно!', 'Местоположение автомобиля сохранено');
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      Alert.alert('Ошибка', 'Не удалось сохранить местоположение');
    }
  };

  const getAddressFromCoordinates = async (lat: number, lon: number): Promise<string> => {
    try {
      const address = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
      if (address.length > 0) {
        const addr = address[0];
        return `${addr.street || ''} ${addr.streetNumber || ''}, ${addr.city || ''}, ${addr.country || ''}`.trim();
      }
      return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    } catch (error) {
      return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    }
  };

  const openInMaps = (coords: {latitude: number, longitude: number}, label: string = 'Destination') => {
    const { latitude, longitude } = coords;
    
    if (Platform.OS === 'android') {
      Linking.openURL(`maps://app?daddr=${latitude},${longitude}`);
    } else {
      Linking.openURL(`google.navigation:q=${latitude},${longitude}`);
    }
  };

  const generateMapHTML = () => {
    if (!userLocation) return '';

    const carMarker = carLocation ? `
      L.marker([${carLocation.latitude}, ${carLocation.longitude}], {icon: L.divIcon({
        html: '<div style="background-color: #EF4444; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; justify-content: center; align-items: center; font-weight: bold;">🚗</div>',
        className: 'car-marker',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      })})
        .addTo(map)
        .bindPopup('<b>🚗 Ваш автомобиль</b><br>${carLocation.address || 'Сохраненное местоположение'}');
    ` : '';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Карта</title>
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
          <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
          <style>
            body { margin: 0; padding: 0; }
            #map { height: 100vh; width: 100vw; }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script>
            var map = L.map('map').setView([${userLocation.latitude}, ${userLocation.longitude}], 15);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '© OpenStreetMap contributors'
            }).addTo(map);
            
            L.marker([${userLocation.latitude}, ${userLocation.longitude}])
              .addTo(map)
              .bindPopup('<b>📍 Вы здесь</b>')
              .openPopup();
            
            ${carMarker}
            
            ${carLocation ? `
              var bounds = L.latLngBounds([
                [${userLocation.latitude}, ${userLocation.longitude}],
                [${carLocation.latitude}, ${carLocation.longitude}]
              ]);
              map.fitBounds(bounds, { padding: [50, 50] });
              
              var polyline = L.polyline([
                [${userLocation.latitude}, ${userLocation.longitude}],
                [${carLocation.latitude}, ${carLocation.longitude}]
              ], {color: 'red', weight: 3, dashArray: '5, 5'}).addTo(map);
            ` : ''}
          </script>
        </body>
      </html>
    `;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Загрузка карты...</Text>
      </View>
    );
  }

  if (locationPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <MapPin size={64} color="#999" />
        <Text style={styles.permissionTitle}>Требуется разрешение</Text>
        <Text style={styles.permissionText}>
          Для работы карты необходимо разрешение на доступ к местоположению
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={initializeLocation}>
          <Text style={styles.permissionButtonText}>Предоставить разрешение</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        {userLocation && Platform.OS === 'android' ? (
          <WebView
            source={{ html: generateMapHTML() }}
            style={styles.webView}
            javaScriptEnabled={true}
            domStorageEnabled={true}
          />
        ) : userLocation ? (
          <View style={styles.placeholderMap}>
            <MapPin size={48} color="#007AFF" />
            <Text style={styles.coordinatesText}>
              📍 Ваше местоположение: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
            </Text>
            {carLocation && (
              <Text style={styles.coordinatesText}>
                🚗 Автомобиль: {carLocation.latitude.toFixed(4)}, {carLocation.longitude.toFixed(4)}
              </Text>
            )}
          </View>
        ) : (
          <View style={styles.placeholderMap}>
            <MapPin size={48} color="#999" />
            <Text style={styles.placeholderText}>Местоположение не определено</Text>
          </View>
        )}
      </View>

      <View style={styles.controlPanel}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {userLocation && (
            <View style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <MapPin size={20} color="#007AFF" />
                <Text style={styles.infoTitle}>Текущее местоположение</Text>
              </View>
              <Text style={styles.infoText}>
                {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}
              </Text>
            </View>
          )}

          {carLocation && (
            <View style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <Car size={20} color="#EF4444" />
                <Text style={styles.infoTitle}>Местоположение автомобиля</Text>
              </View>
              <Text style={styles.infoText}>
                {carLocation.address || `${carLocation.latitude.toFixed(6)}, ${carLocation.longitude.toFixed(6)}`}
              </Text>
              {carLocation.floor && (
                <Text style={styles.infoText}>Этаж: {carLocation.floor}</Text>
              )}
              {carLocation.notes && (
                <Text style={styles.infoText}>Заметки: {carLocation.notes}</Text>
              )}
              <Text style={styles.timestampText}>
                Сохранено: {new Date(carLocation.timestamp).toLocaleString()}
              </Text>
            </View>
          )}

          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={getCurrentLocation}
              disabled={isLocating}
            >
              <RefreshCw size={20} color="#FFF" />
              <Text style={styles.buttonText}>
                {isLocating ? 'Определение...' : 'Обновить местоположение'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={() => setShowSaveModal(true)}
              disabled={!userLocation}
            >
              <Save size={20} color="#007AFF" />
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                Сохранить местоположение
              </Text>
            </TouchableOpacity>

            {carLocation && (
              <TouchableOpacity
                style={[styles.button, styles.navigateButton]}
                onPress={() => openInMaps(carLocation, 'Ваш автомобиль')}
              >
                <Navigation size={20} color="#FFF" />
                <Text style={styles.buttonText}>Проложить маршрут к авто</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>

      <Modal
        visible={showSaveModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSaveModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Сохранение местоположения</Text>
              <TouchableOpacity onPress={() => setShowSaveModal(false)}>
                <X size={24} color="#999" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Этаж (необязательно)</Text>
            <TextInput
              style={styles.input}
              placeholder="Например: 3 или P2"
              value={floor}
              onChangeText={setFloor}
            />

            <Text style={styles.inputLabel}>Заметки (необязательно)</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Например: Возле лифта, синий столб"
              value={notes}
              onChangeText={setNotes}
              multiline
            />

            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={saveParkingLocation}
            >
              <Save size={20} color="#FFF" />
              <Text style={styles.buttonText}>Сохранить</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F5F5F5',
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: '#333',
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#E8E8E8',
  },
  webView: {
    flex: 1,
  },
  placeholderMap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#E8E8E8',
  },
  placeholderText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  coordinatesText: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
  },
  controlPanel: {
    backgroundColor: '#FFF',
    maxHeight: height * 0.4,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  infoCard: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  timestampText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  buttonsContainer: {
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  navigateButton: {
    backgroundColor: '#EF4444',
  },
  saveButton: {
    backgroundColor: '#34D399',
    marginTop: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  secondaryButtonText: {
    color: '#007AFF',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
});