import { Tabs, useRouter, usePathname } from 'expo-router';
import React from 'react';
import LiquidMenu from '@/components/LiquidMenu';

export default function TabLayout() {
  const router = useRouter();
  const pathname = usePathname();

  // Determine active tab based on current pathname
  let activeTab = 'home';
  if (pathname.includes('random-food')) activeTab = 'random';
  else if (pathname.includes('explore')) activeTab = 'ingredients';
  else if (pathname.includes('profile')) activeTab = 'profile';

  const handleTabChange = (id: string) => {
    if (id === 'home') router.push('/(tabs)');
    else if (id === 'random') router.push('/(tabs)/random-food');
    else if (id === 'ingredients') router.push('/(tabs)/explore');
    else if (id === 'profile') router.push('/(tabs)/Profile');
  };

  return (
    <Tabs
      tabBar={() => <LiquidMenu active={activeTab} onChange={handleTabChange} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="random-food" />
      <Tabs.Screen name="explore" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
