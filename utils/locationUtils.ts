import * as Location from 'expo-location';
import * as Linking from 'expo-linking';
import { Platform, Alert } from 'react-native';

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export const requestLocationPermission = async (): Promise<boolean> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Ошибка запроса разрешения на местоположение:', error);
    return false;
  }
};

export const getCurrentLocation = async (): Promise<LocationCoords | null> => {
  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
      timeInterval: 15000,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.error('Ошибка получения текущего местоположения:', error);
    return null;
  }
};

export const getAddressFromCoordinates = async (
  latitude: number,
  longitude: number
): Promise<string> => {
  try {
    const addresses = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });

    if (addresses.length > 0) {
      const addr = addresses[0];
      const parts = [
        addr.street,
        addr.streetNumber,
        addr.city,
        addr.region,
        addr.country,
      ].filter(Boolean);

      return parts.length > 0 ? parts.join(', ') : `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    }

    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  } catch (error) {
    console.error('Ошибка получения адреса:', error);
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }
};

export const calculateDistance = (
  point1: LocationCoords,
  point2: LocationCoords
): number => {
  const R = 6371;
  const dLat = ((point2.latitude - point1.latitude) * Math.PI) / 180;
  const dLon = ((point2.longitude - point1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((point1.latitude * Math.PI) / 180) *
      Math.cos((point2.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
};

export const openInMaps = async (
  destination: LocationCoords,
  label: string = 'Destination',
  origin?: LocationCoords
): Promise<void> => {
  const { latitude, longitude } = destination;
  
  try {
    if (Platform.OS === 'android') {
      const appleMapsUrl = origin
        ? `maps://app?saddr=${origin.latitude},${origin.longitude}&daddr=${latitude},${longitude}`
        : `maps://app?daddr=${latitude},${longitude}`;

      const canOpenAppleMaps = await Linking.canOpenURL(appleMapsUrl);
      
      if (canOpenAppleMaps) {
        await Linking.openURL(appleMapsUrl);
      } else {
        const googleMapsUrl = origin
          ? `https://maps.google.com/maps?saddr=${origin.latitude},${origin.longitude}&daddr=${latitude},${longitude}`
          : `https://maps.google.com/maps?daddr=${latitude},${longitude}`;
        
        await Linking.openURL(googleMapsUrl);
      }
    } else {
      const mapSchemes = [
        `google.navigation:q=${latitude},${longitude}`,
        `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodeURIComponent(label)})`,
        `yandexmaps://maps.yandex.ru/?pt=${longitude},${latitude}&z=16&l=map`,
        `https://maps.google.com/maps?daddr=${latitude},${longitude}`,
      ];

      let opened = false;
      
      for (const scheme of mapSchemes) {
        try {
          const canOpen = await Linking.canOpenURL(scheme);
          if (canOpen) {
            await Linking.openURL(scheme);
            opened = true;
            break;
          }
        } catch (error) {
          console.warn(`Не удалось открыть схему: ${scheme}`, error);
        }
      }

      if (!opened) {
        Alert.alert(
          'Карты недоступны',
          'Не найдено подходящее приложение для навигации. Установите Google Maps или другое приложение карт.'
        );
      }
    }
  } catch (error) {
    console.error('Ошибка открытия карт:', error);
    Alert.alert('Ошибка', 'Не удалось открыть приложение карт');
  }
};

export const formatDistance = (distanceKm: number): string => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} м`;
  } else if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)} км`;
  } else {
    return `${Math.round(distanceKm)} км`;
  }
};

export const formatCoordinates = (coords: LocationCoords): string => {
  return `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
};