import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { signInWithCredential, GoogleAuthProvider, signOut } from 'firebase/auth';
import { ref, push, serverTimestamp } from 'firebase/database';
import * as Location from 'expo-location';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '../contexts/AuthContext';
import { auth, database } from '../lib/firebase';

WebBrowser.maybeCompleteAuthSession();

export default function LocationTrackingScreen() {
  const { user, loading } = useAuth();
  const [isTracking, setIsTracking] = useState(false);
  const [locationSubscription, setLocationSubscription] = useState<Location.LocationSubscription | null>(null);
  const [trackingData, setTrackingData] = useState<any[]>([]);

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: Platform.select({
      ios: 'your-ios-client-id.apps.googleusercontent.com',
      android: 'your-android-client-id.apps.googleusercontent.com',
      web: 'your-web-client-id.apps.googleusercontent.com',
    }),
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      if (authentication?.accessToken) {
        const credential = GoogleAuthProvider.credential(authentication.idToken, authentication.accessToken);
        signInWithCredential(auth, credential);
      }
    }
  }, [response]);

  const handleGoogleSignIn = async () => {
    try {
      await promptAsync();
    } catch (error) {
      console.error('Google Sign In Error:', error);
      Alert.alert('Error', 'Failed to sign in with Google');
    }
  };

  const handleSignOut = async () => {
    try {
      if (isTracking) {
        stopTracking();
      }
      await signOut(auth);
    } catch (error) {
      console.error('Sign Out Error:', error);
      Alert.alert('Error', 'Failed to sign out');
    }
  };

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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.authContainer}>
          <Ionicons name="location" size={80} color="#007AFF" style={styles.icon} />
          <Text style={styles.title}>Location Tracker</Text>
          <Text style={styles.subtitle}>Sign in with Google to start tracking your location</Text>
          
          <TouchableOpacity 
            style={styles.googleButton} 
            onPress={handleGoogleSignIn}
            disabled={!request}
          >
            <Ionicons name="logo-google" size={24} color="white" />
            <Text style={styles.googleButtonText}>Sign in with Google</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Text style={styles.welcomeText}>Welcome, {user.displayName}</Text>
          <Text style={styles.emailText}>{user.email}</Text>
        </View>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
        </TouchableOpacity>
      </View>

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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  icon: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 24,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4285F4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  googleButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  userInfo: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  emailText: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  signOutButton: {
    padding: 8,
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
});