import { Stack } from 'expo-router';

export default function Layout() {
  // ปิดหัว Header ของ Expo ทิ้ง เพื่อให้ Header ธีม Steam ของเราแสดงผลแทน
  return <Stack screenOptions={{ headerShown: false }} />;
}
