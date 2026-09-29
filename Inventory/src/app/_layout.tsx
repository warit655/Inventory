import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* บอกระบบว่าถ้าเข้าแอปมา ให้วิ่งไปหาโฟลเดอร์ (tabs) ก่อนเป็นอันดับแรก */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}