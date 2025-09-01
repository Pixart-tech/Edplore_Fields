import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

// Platform-specific imports
let MapView, Marker, PROVIDER_GOOGLE;
if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
  PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
}

interface Coordinate {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
}

export default function MapScreen() {
  const [tableName, setTableName] = useState('');
  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);
  const [loading, setLoading] = useState(false);
  const [region, setRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const backendUrl = Constants.expoConfig?.extra?.backendUrl || process.env.EXPO_PUBLIC_BACKEND_URL;

  const fetchCoordinatesFromDynamoDB = async () => {
    if (!tableName.trim()) {
      Alert.alert('Error', 'Please enter a table name');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/coordinates/${tableName}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.coordinates && data.coordinates.length > 0) {
        setCoordinates(data.coordinates);
        
        // Center map on first coordinate
        const firstCoord = data.coordinates[0];
        setRegion({
          latitude: firstCoord.latitude,
          longitude: firstCoord.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
        
        Alert.alert('Success', `Loaded ${data.coordinates.length} coordinates from ${tableName}`);
      } else {
        setCoordinates([]);
        Alert.alert('Info', 'No coordinates found in the specified table');
      }
    } catch (error) {
      console.error('Fetch Error:', error);
      Alert.alert('Error', `Failed to fetch coordinates: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const clearMap = () => {
    setCoordinates([]);
    setTableName('');
    setRegion({
      latitude: 37.78825,
      longitude: -122.4324,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.controlsContainer}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter DynamoDB table name"
            value={tableName}
            onChangeText={setTableName}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[styles.fetchButton, { opacity: loading ? 0.6 : 1 }]}
            onPress={fetchCoordinatesFromDynamoDB}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="search" size={20} color="white" />
            )}
            <Text style={styles.fetchButtonText}>
              {loading ? 'Loading...' : 'Fetch'}
            </Text>
          </TouchableOpacity>
        </View>

        {coordinates.length > 0 && (
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              Showing {coordinates.length} pins from "{tableName}"
            </Text>
            <TouchableOpacity style={styles.clearButton} onPress={clearMap}>
              <Ionicons name="trash-outline" size={16} color="#FF3B30" />
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.mapContainer}>
        {Platform.OS === 'web' ? (
          <View style={styles.webMapPlaceholder}>
            <Ionicons name="map-outline" size={64} color="#8E8E93" />
            <Text style={styles.webMapText}>Map view is available on mobile devices</Text>
            <Text style={styles.webMapSubtext}>Install the Expo Go app to view maps</Text>
            {coordinates.length > 0 && (
              <ScrollView style={styles.coordinatesList}>
                <Text style={styles.coordinatesTitle}>Loaded Coordinates:</Text>
                {coordinates.map((coord, index) => (
                  <View key={coord.id} style={styles.coordinateItem}>
                    <Text style={styles.coordinateTitle}>{coord.title}</Text>
                    <Text style={styles.coordinateLocation}>
                      {coord.latitude.toFixed(6)}, {coord.longitude.toFixed(6)}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        ) : (
          <MapView
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            region={region}
            onRegionChangeComplete={setRegion}
            showsUserLocation={true}
            showsMyLocationButton={true}
          >
            {coordinates.map((coord) => (
              <Marker
                key={coord.id}
                coordinate={{
                  latitude: coord.latitude,
                  longitude: coord.longitude,
                }}
                title={coord.title}
                description={`Lat: ${coord.latitude.toFixed(6)}, Lng: ${coord.longitude.toFixed(6)}`}
                pinColor="#007AFF"
              />
            ))}
          </MapView>
        )}
      </View>

      {coordinates.length > 0 && (
        <View style={styles.legendContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {coordinates.slice(0, 5).map((coord, index) => (
              <View key={coord.id} style={styles.legendItem}>
                <View style={styles.legendPin} />
                <Text style={styles.legendText} numberOfLines={1}>
                  {coord.title}
                </Text>
              </View>
            ))}
            {coordinates.length > 5 && (
              <Text style={styles.moreText}>+{coordinates.length - 5} more</Text>
            )}
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  controlsContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#F2F2F7',
  },
  fetchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 4,
    minWidth: 80,
    justifyContent: 'center',
  },
  fetchButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#8E8E93',
    flex: 1,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearButtonText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '500',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  legendContainer: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    maxWidth: 120,
  },
  legendPin: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#000',
    fontWeight: '500',
  },
  moreText: {
    fontSize: 12,
    color: '#8E8E93',
    alignSelf: 'center',
    fontStyle: 'italic',
  },
});