<<<<<<< HEAD
import { Stack } from 'expo-router';
export default function Layout() {
  // ปิดหัว Header ของ Expo ทิ้ง
  return <Stack screenOptions={{ headerShown: false }} />;
}
=======
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <AppTabs />
    </ThemeProvider>
  );
}
>>>>>>> 0a8581912baf9d764f7f5dd593beff601fbe8ae2
