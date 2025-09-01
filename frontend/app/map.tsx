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
  };

  const openInMaps = (coord: Coordinate) => {
    const url = Platform.select({
      ios: `maps:0,0?q=${coord.latitude},${coord.longitude}`,
      android: `geo:0,0?q=${coord.latitude},${coord.longitude}(${coord.title})`,
      default: `https://maps.google.com/maps?q=${coord.latitude},${coord.longitude}`,
    });
    
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      // On mobile, we would use Linking.openURL(url)
      Alert.alert('Open in Maps', `Would open: ${coord.title}\n${coord.latitude}, ${coord.longitude}`);
    }
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
              Found {coordinates.length} locations from "{tableName}"
            </Text>
            <TouchableOpacity style={styles.clearButton} onPress={clearMap}>
              <Ionicons name="trash-outline" size={16} color="#FF3B30" />
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <Ionicons name="map-outline" size={64} color="#007AFF" />
          <Text style={styles.mapPlaceholderTitle}>Interactive Map View</Text>
          <Text style={styles.mapPlaceholderSubtext}>
            {Platform.OS === 'web' 
              ? 'Tap coordinates below to open in Google Maps'
              : 'Native maps available on mobile devices'
            }
          </Text>
          
          {coordinates.length > 0 && (
            <ScrollView style={styles.coordinatesList} showsVerticalScrollIndicator={false}>
              <Text style={styles.coordinatesTitle}>Loaded Coordinates:</Text>
              {coordinates.map((coord, index) => (
                <TouchableOpacity
                  key={coord.id}
                  style={styles.coordinateItem}
                  onPress={() => openInMaps(coord)}
                >
                  <View style={styles.coordinateHeader}>
                    <View style={styles.coordinatePin} />
                    <Text style={styles.coordinateTitle}>{coord.title}</Text>
                    <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
                  </View>
                  <Text style={styles.coordinateLocation}>
                    Lat: {coord.latitude.toFixed(6)}, Lng: {coord.longitude.toFixed(6)}
                  </Text>
                  <Text style={styles.tapHint}>Tap to open in maps</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
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
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 24,
  },
  mapPlaceholderTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
    textAlign: 'center',
  },
  mapPlaceholderSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  coordinatesList: {
    marginTop: 24,
    maxHeight: 300,
    width: '100%',
  },
  coordinatesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
    textAlign: 'center',
  },
  coordinateItem: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  coordinateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  coordinatePin: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    marginRight: 8,
  },
  coordinateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  coordinateLocation: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  tapHint: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
});