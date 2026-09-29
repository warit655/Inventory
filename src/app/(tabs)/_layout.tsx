import { Tabs } from 'expo-router';
import { Platform, Text } from 'react-native';
import { useEffect, useState } from 'react';

export default function TabLayout() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const role = window.localStorage.getItem('role');

      setIsAdmin(
        role?.trim().toLowerCase() === 'admin'
      );
    }
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          height: Platform.OS === 'ios' ? 78 : 62,
          paddingBottom: Platform.OS === 'ios' ? 18 : 6,
          paddingTop: 5,
          paddingHorizontal: 8,
        },

        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#9CA3AF',

        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: -2,
        },

        // กระจายเมนูให้เต็มความกว้าง
        tabBarItemStyle: {
          flex: 1,
          paddingHorizontal: 0,
          marginHorizontal: 0,
        },

        tabBarIconStyle: {
          marginBottom: -1,
        },
      }}
    >

      {/* Home */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: () => (
            <Text style={{ fontSize: 18 }}>🏠</Text>
          ),
        }}
      />

      {/* Cart */}
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: () => (
            <Text style={{ fontSize: 18 }}>🛒</Text>
          ),
        }}
      />

      {/* Orders */}
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: () => (
            <Text style={{ fontSize: 18 }}>📦</Text>
          ),
        }}
      />

      {/* Shipping */}
      <Tabs.Screen
        name="shipping"
        options={{
          title: 'Shipping',
          tabBarIcon: () => (
            <Text style={{ fontSize: 18 }}>🚚</Text>
          ),
        }}
      />

      {/* Profile */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: () => (
            <Text style={{ fontSize: 18 }}>👤</Text>
          ),
        }}
      />

      {/* Claim */}
      <Tabs.Screen
        name="claim"
        options={{
          title: 'Claim',
          tabBarIcon: () => (
            <Text style={{ fontSize: 18 }}>🛡️</Text>
          ),
        }}
      />

      {/* Claim Admin - Admin only */}
      <Tabs.Screen
        name="claim-admin"
        options={{
          title: 'Claim Admin',

          tabBarButton: isAdmin
            ? undefined
            : () => null,

          tabBarIcon: () => (
            <Text style={{ fontSize: 18 }}>👑</Text>
          ),
        }}
      />

      {/* Dashboard - Admin only */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',

          tabBarButton: isAdmin
            ? undefined
            : () => null,

          tabBarIcon: () => (
            <Text style={{ fontSize: 18 }}>📊</Text>
          ),
        }}
      />

    </Tabs>
  );
}
