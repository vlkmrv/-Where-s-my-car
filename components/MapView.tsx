import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

interface MapViewProps {
  userLocation: {
    latitude: number;
    longitude: number;
  };
  carLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  style?: any;
}

export default function MapView({ userLocation, carLocation, style }: MapViewProps) {
  const generateMapHTML = () => {
    const carMarker = carLocation ?
      `L.marker([${carLocation.latitude}, ${carLocation.longitude}], {
        icon: L.divIcon({
          html: '<div style="background: #FF6B35; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
          iconSize: [20, 20],
          className: 'custom-marker'
        })
      })
        .addTo(map)
        .bindPopup('<b>🚗 Ваш автомобиль</b><br>${carLocation.address || 'Сохраненное местоположение'}');` : '';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
          <title>Карта</title>
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
          <style>
            body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            #map { height: 100vh; width: 100vw; }
            .custom-marker { background: transparent !important; border: none !important; }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script>
            var map = L.map('map').setView([${userLocation.latitude}, ${userLocation.longitude}], 15);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '© OpenStreetMap contributors',
              maxZoom: 19,
            }).addTo(map);
            
            L.marker([${userLocation.latitude}, ${userLocation.longitude}]).addTo(map).bindPopup('<b>📍 Вы здесь</b>').openPopup();
            ${carMarker}
          </script>
        </body>
      </html>
    `;
  }

  return (
    <View style={style}>
      <WebView originWhitelist={['*']} source={{ html: generateMapHTML() }} />
    </View>
  );
}

const styles = StyleSheet.create({
  webView: {
    flex: 1,
  },
  mobileView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F0F0F0',
  },
  mobileTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  coordinateText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  mobileHint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
});