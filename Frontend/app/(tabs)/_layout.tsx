import { Tabs, useRouter, usePathname } from 'expo-router';
import React from 'react';
import LiquidMenu from '@/components/liquid-menu';
import { useAuth } from '@/context/AuthContext';

export default function TabLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn } = useAuth();

  // Determine active tab based on current pathname
  let activeTab = 'home';
  if (pathname.includes('random-food')) activeTab = 'random';
  else if (pathname.includes('random-ingredient')) activeTab = 'ingredients';
  else if (pathname.includes('profile')) activeTab = 'profile';

  const handleTabChange = (id: string) => {
    if (id === 'home') router.push('/');
    else if (id === 'random') router.push('/(tabs)/random-food');
    else if (id === 'ingredients') router.push('/(tabs)/random-ingredient');
    else if (id === 'profile') {
      if (!isLoggedIn) {
        router.push({
          pathname: '/(auth)/login',
          params: { returnTo: '/(tabs)/profile', from: pathname || '/' },
        });
      } else {
        router.push('/(tabs)/profile');
      }
    }
  };

  return (
    <Tabs
      tabBar={() => <LiquidMenu active={activeTab} onChange={handleTabChange} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="random-food" />
      <Tabs.Screen name="search" />
      <Tabs.Screen name="random-ingredient" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
