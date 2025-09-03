import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signInWithCredential, GoogleAuthProvider, signOut } from 'firebase/auth';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { auth } from '../lib/firebase';

WebBrowser.maybeCompleteAuthSession();

function AuthScreen() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: Platform.select({
      ios: 'your-ios-client-id.apps.googleusercontent.com',
      android: 'your-android-client-id.apps.googleusercontent.com',
      web: 'your-web-client-id.apps.googleusercontent.com',
    }),
  });

  React.useEffect(() => {
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
    }
  };

  return (
    <SafeAreaView style={styles.authContainer}>
      <View style={styles.authContent}>
        <Ionicons name="location" size={80} color="#007AFF" style={styles.icon} />
        <Text style={styles.title}>Location Tracker</Text>
        <Text style={styles.subtitle}>
          Sign in with Google to access location tracking and map view
        </Text>
        
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

function AuthenticatedApp() {
  const { user } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign Out Error:', error);
    }
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        headerStyle: {
          backgroundColor: '#F2F2F7',
        },
        headerTintColor: '#000',
        tabBarStyle: {
          backgroundColor: '#F2F2F7',
        },
        headerRight: () => (
          <TouchableOpacity 
            style={styles.signOutButton} 
            onPress={handleSignOut}
          >
            <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Map View',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map" size={size} color={color} />
          ),
          headerTitle: `Map View - ${user?.displayName || 'User'}`,
        }}
      />
      <Tabs.Screen
        name="tracking"
        options={{
          title: 'Location Tracking',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="location" size={size} color={color} />
          ),
          headerTitle: `Location Tracking - ${user?.displayName || 'User'}`,
        }}
      />
    </Tabs>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return user ? <AuthenticatedApp /> : <AuthScreen />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  authContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  authContent: {
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
  signOutButton: {
    padding: 8,
    marginRight: 8,
  },
});