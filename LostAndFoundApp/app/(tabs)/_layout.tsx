import { FontAwesome } from '@expo/vector-icons';
import { router, Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';

/**
 * Helper component for tab bar icons
 */
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={24} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();
  const backgroundColor = useThemeColor({}, 'background');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Redirect to login if not authenticated
      router.replace('/auth/login');
    }
  }, [isAuthenticated, isLoading]);

  // Don't render tabs while checking authentication status
  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colorScheme === 'dark' ? '#fff' : '#000',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: { backgroundColor },
        headerStyle: { backgroundColor },
        headerTintColor: colorScheme === 'dark' ? '#fff' : '#000',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('common.home'),
          tabBarLabel: t('common.home'),
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: t('common.explore'),
          tabBarLabel: t('common.explore'),
          tabBarIcon: ({ color }) => <TabBarIcon name="search" color={color} />,
        }}
      />
      <Tabs.Screen
        name="add-item"
        options={{
          title: t('common.addItem'),
          tabBarLabel: t('common.addItem'),
          tabBarIcon: ({ color }) => <TabBarIcon name="plus-square" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('common.profile'),
          tabBarLabel: t('common.profile'),
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
        }}
      />
    </Tabs>
  );
}
