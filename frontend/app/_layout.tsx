import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider } from '../contexts/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
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
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Location Tracking',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="location" size={size} color={color} />
            ),
            headerTitle: 'Location Tracking',
          }}
        />
        <Tabs.Screen
          name="map"
          options={{
            title: 'Map View',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="map" size={size} color={color} />
            ),
            headerTitle: 'Map View',
          }}
        />
      </Tabs>
    </AuthProvider>
  );
}