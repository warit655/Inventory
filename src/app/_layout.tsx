import { Stack } from 'expo-router';
export default function Layout() {
  // ปิดหัว Header ของ Expo ทิ้ง
  return <Stack screenOptions={{ headerShown: false }} />;
}