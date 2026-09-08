import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Platform, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// 💡 อัลกอริทึม K-Means จากอาจารย์
const clusterPricesLocally = (data: any[]) => {
  if (!data || data.length === 0) return [];
  const prices = data.map(item => parseFloat(item.price));
  
  let centroids = [
    Math.min(...prices), 
    (Math.min(...prices) + Math.max(...prices)) / 2, 
    Math.max(...prices)
  ];
  
  let assignments: number[] = [];
  let changed = true;

  while (changed) {
    changed = false;
    assignments = prices.map(price => {
      const diffs = centroids.map(c => Math.abs(price - c));
      return diffs.indexOf(Math.min(...diffs));
    });

    const newCentroids = [0, 1, 2].map(i => {
      const clusterPrices = prices.filter((_, index) => assignments[index] === i);
      return clusterPrices.length 
        ? clusterPrices.reduce((a, b) => a + b, 0) / clusterPrices.length 
        : centroids[i];
    });

    if (JSON.stringify(centroids) !== JSON.stringify(newCentroids)) {
      centroids = newCentroids;
      changed = true;
    }
  }

  const sortedCentroids = [...centroids].sort((a, b) => a - b);
  const labels = ["Low", "Mid", "High"];

  return data.map((item, index) => {
    const myCentroid = centroids[assignments[index]];
    const tierIndex = sortedCentroids.indexOf(myCentroid);
    return { ...item, priceTier: labels[tierIndex] };
  });
};

export default function AIScreen() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 💡 ดึงข้อมูลเกมจาก API 
    fetch('http://119.59.102.161:3100/warit_game_api')
      .then(response => response.json())
      .then(json => {
        if (json.success) {
          const clusteredData = clusterPricesLocally(json.data);
          setInventory(clusteredData);
        }
      })
      .catch(error => console.error('Fetch error:', error))
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f1722" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/')} style={styles.backBtn}>
          <Text style={styles.backBtnText}>❮ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI<Text style={styles.headerTitleLight}> ANALYSIS</Text></Text>
      </View>

      <View style={styles.descriptionBox}>
        <Text style={styles.descriptionText}>
          ระบบประมวลผล K-Means Machine Learning สำหรับจัดกลุ่มราคาเกมแบบ Real-time โดยชิปประมวลผลสมาร์ตโฟน
        </Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}><ActivityIndicator size="large" color="#a4d007" /></View>
      ) : (
        <FlatList
          data={inventory}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listPadding}
          renderItem={({ item }) => {
            // กำหนดสีป้ายตามเกรดราคา
            const tierColor = item.priceTier === 'High' ? '#f43f5e' : item.priceTier === 'Mid' ? '#66c0f4' : '#a4d007';
            
            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.title}>{item.game_title}</Text>
                  <View style={[styles.tierBadge, { borderColor: tierColor, backgroundColor: `${tierColor}20` }]}>
                    <Text style={[styles.tierText, { color: tierColor }]}>{item.priceTier}</Text>
                  </View>
                </View>
                <Text style={styles.subtitle}>Genre: {item.genre}  |  Platform: {item.platform}</Text>
                <Text style={styles.price}>Price: ${item.price}</Text>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0e141b' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: Platform.OS === 'web' ? 30 : 20, backgroundColor: '#0f1722', borderBottomWidth: 1, borderBottomColor: '#1e2d3e' },
  backBtn: { marginRight: 15 },
  backBtnText: { fontSize: 16, color: '#4c5b6a', fontWeight: 'bold' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#ffffff', letterSpacing: 1 },
  headerTitleLight: { fontWeight: '300', color: '#a4d007' },
  
  descriptionBox: { margin: 20, padding: 15, backgroundColor: 'rgba(164, 208, 7, 0.1)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(164, 208, 7, 0.3)' },
  descriptionText: { color: '#a4d007', fontSize: 13, textAlign: 'center', lineHeight: 20, fontWeight: '600' },
  
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listPadding: { paddingHorizontal: 20, paddingBottom: 40 },
  
  card: { padding: 16, backgroundColor: '#17202d', marginBottom: 12, borderRadius: 12, borderWidth: 1, borderColor: '#2a475e' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontWeight: 'bold', fontSize: 16, color: '#ffffff', flex: 1 },
  subtitle: { fontSize: 12, color: '#4c5b6a', marginBottom: 8 },
  price: { fontSize: 15, fontWeight: 'bold', color: '#c7d5e0' },
  
  tierBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  tierText: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
});