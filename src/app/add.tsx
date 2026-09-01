import { router } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const API_BASE_URL = 'http://119.59.102.161:3100/api';

export default function AddProductScreen() {
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState('');
  const [locationText, setLocationText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [saving, setSaving] = useState(false); // กันกดซ้ำตอนกำลังบันทึก

  // ฟังก์ชันส่งข้อมูลไปยัง Backend
  const handleAddProduct = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a product name');
      return;
    }

    if (saving) return; // กันกดซ้ำ
    setSaving(true);

    const payload = {
      id: sku || String(Date.now()),
      name: name,
      category: category,
      stock: parseInt(stock) || 0,
      location_text: locationText || 'KRAFTON, Inc.',
      badge_status: 'Active',
      image_url: imageUrl,
    };

    console.log('Sending product to server:', payload);
    console.log('POST URL:', `${API_BASE_URL}/products`);

    try {
      const response = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log('Response status:', response.status);

      // ป้องกันกรณี server ไม่ได้ส่ง JSON กลับมา (เช่น error page เป็น HTML)
      let data: any = {};
      try {
        data = await response.json();
      } catch (parseErr) {
        console.warn('Response body is not valid JSON:', parseErr);
      }

      console.log('Response body:', data);

      // แก้: เดิมต้องมี data.success หรือ data.productId ถึงจะถือว่าสำเร็จ
      // ถ้า backend ไม่ได้ส่ง field พวกนี้กลับมา จะโดนตีเป็น "Failed" ทั้งที่จริงบันทึกสำเร็จแล้ว
      // ตอนนี้ใช้ response.ok (HTTP status 200-299) เป็นหลักในการตัดสินความสำเร็จแทน
      if (response.ok) {
        Alert.alert('Success', 'Product added successfully!', [
          {
            text: 'OK',
            onPress: () => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.navigate('/');
              }
            },
          },
        ]);
      } else {
        Alert.alert(
          'Error',
          data?.error || data?.message || `Failed to add product (status ${response.status})`
        );
      }
    } catch (error) {
      console.error('Add product request failed:', error);
      Alert.alert(
        'Error',
        'Cannot connect to server. Please check your internet connection and server address.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.headerTitle}>Add Product</Text>

      <Text style={styles.label}>Product ID / SKU</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter product ID (e.g. 4)"
        placeholderTextColor="#8f98a0"
        onChangeText={setSku}
        value={sku}
      />

      <Text style={styles.label}>Name *</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter product/game name"
        placeholderTextColor="#8f98a0"
        onChangeText={setName}
        value={name}
      />

      <Text style={styles.label}>Category</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter category (e.g. Action, Free to play)"
        placeholderTextColor="#8f98a0"
        onChangeText={setCategory}
        value={category}
      />

      <Text style={styles.label}>Stock</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter stock quantity"
        placeholderTextColor="#8f98a0"
        onChangeText={setStock}
        value={stock}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Developer / Location</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter developer or store location"
        placeholderTextColor="#8f98a0"
        onChangeText={setLocationText}
        value={locationText}
      />

      <Text style={styles.label}>Image URL</Text>
      <TextInput
        style={styles.input}
        placeholder="https://..."
        placeholderTextColor="#8f98a0"
        onChangeText={setImageUrl}
        value={imageUrl}
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.cancelButton}
          disabled={saving}
          onPress={() => (router.canGoBack() ? router.back() : router.navigate('/'))}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleAddProduct}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#171a21" />
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1b2838',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#c7d5e0',
    letterSpacing: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    color: '#66c0f4',
  },
  input: {
    backgroundColor: '#2a475e',
    borderWidth: 1,
    borderColor: '#3b6182',
    color: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 6,
    marginBottom: 16,
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    backgroundColor: '#2a475e',
    borderRadius: 6,
    marginRight: 10,
    alignItems: 'center',
  },
  saveButton: {
    flex: 1,
    padding: 14,
    backgroundColor: '#66c0f4',
    borderRadius: 6,
    marginLeft: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  cancelText: {
    fontWeight: 'bold',
    color: '#c7d5e0',
  },
  saveText: {
    fontWeight: 'bold',
    color: '#171a21',
  },
});
