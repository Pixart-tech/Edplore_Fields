import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ref, push, serverTimestamp } from 'firebase/database';
import * as Location from 'expo-location';
import { useAuth } from '../contexts/AuthContext';
import { database } from '../lib/firebase';

export default function LocationTrackingScreen() {
  const { user } = useAuth();
  const [isTracking, setIsTracking] = useState(false);
  const [locationSubscription, setLocationSubscription] = useState<Location.LocationSubscription | null>(null);
  const [trackingData, setTrackingData] = useState<any[]>([]);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to track your location.');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Permission Error:', error);
      return false;
    }
  };

  const startTracking = async () => {
    if (!user) {
      Alert.alert('Error', 'Please sign in first');
      return;
    }

    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return;

    try {
      setIsTracking(true);
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000, // 10 seconds
          distanceInterval: 10, // 10 meters
        },
        async (location) => {
          const locationData = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            timestamp: serverTimestamp(),
            accuracy: location.coords.accuracy,
            userId: user.uid,
          };

          // Save to Firebase Realtime Database
          const locationsRef = ref(database, `locations/${user.uid}`);
          await push(locationsRef, locationData);

          // Update local state for display
          setTrackingData(prev => [...prev, { ...locationData, timestamp: new Date().toISOString() }]);
        }
      );

      setLocationSubscription(subscription);
      Alert.alert('Success', 'Location tracking started');
    } catch (error) {
      console.error('Tracking Error:', error);
      Alert.alert('Error', 'Failed to start location tracking');
      setIsTracking(false);
    }
  };

  const stopTracking = () => {
    if (locationSubscription) {
      locationSubscription.remove();
      setLocationSubscription(null);
    }
    setIsTracking(false);
    Alert.alert('Success', 'Location tracking stopped');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.trackingContainer}>
        <View style={styles.statusContainer}>
          <View style={[styles.statusIndicator, { backgroundColor: isTracking ? '#34C759' : '#8E8E93' }]} />
          <Text style={styles.statusText}>
            {isTracking ? 'Tracking Active' : 'Tracking Stopped'}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.trackingButton, { backgroundColor: isTracking ? '#FF3B30' : '#34C759' }]}
          onPress={isTracking ? stopTracking : startTracking}
        >
          <Ionicons 
            name={isTracking ? 'stop-circle' : 'play-circle'} 
            size={30} 
            color="white" 
          />
          <Text style={styles.trackingButtonText}>
            {isTracking ? 'Stop Tracking' : 'Start Tracking'}
          </Text>
        </TouchableOpacity>

        {trackingData.length > 0 && (
          <View style={styles.dataContainer}>
            <Text style={styles.dataTitle}>Recent Locations ({trackingData.length})</Text>
            <View style={styles.locationInfo}>
              <Text style={styles.locationText}>
                Last Location: {trackingData[trackingData.length - 1]?.latitude.toFixed(6)}, {trackingData[trackingData.length - 1]?.longitude.toFixed(6)}
              </Text>
              <Text style={styles.timestampText}>
                {new Date(trackingData[trackingData.length - 1]?.timestamp).toLocaleTimeString()}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={24} color="#007AFF" />
            <Text style={styles.infoHeaderText}>How it works</Text>
          </View>
          <Text style={styles.infoText}>
            • Tap "Start Tracking" to begin recording your location
          </Text>
          <Text style={styles.infoText}>
            • Location data is saved every 10 seconds to Firebase
          </Text>
          <Text style={styles.infoText}>
            • Tap "Stop Tracking" to end the session
          </Text>
          <Text style={styles.infoText}>
            • All data is securely stored in your Firebase account
          </Text>
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
  trackingContainer: {
    flex: 1,
    padding: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    justifyContent: 'center',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  trackingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 24,
    gap: 8,
  },
  trackingButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  dataContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  dataTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  locationInfo: {
    backgroundColor: '#F2F2F7',
    padding: 12,
    borderRadius: 8,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  timestampText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 6,
    lineHeight: 20,
  },
});