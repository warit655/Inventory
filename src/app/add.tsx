import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const API_BASE_URL = 'http://119.59.102.161:3100/api';

export default function AddScreen() {
  const [formData, setFormData] = useState({
    name: '', brand: '', vram: '', serial_number: '', cost_price: '', selling_price: '', stock: '', category: '', image: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!formData.name) return alert('ERROR: NAME REQUIRED');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) router.back();
      else alert('UPLOAD FAILED');
    } catch (err) {
      alert('CONNECTION SEVERED');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#05050A" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>{'<'} ABORT_SEQ</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>INIT // <Text style={{color: '#FFF'}}>ASSET</Text></Text>
        <View style={{ width: 80 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.formCard}>
            
            <Text style={styles.label}>[ STR ] PRODUCT_NAME</Text>
            <TextInput 
              style={styles.input} 
              placeholder="ROG STRIX RTX 5090" 
              placeholderTextColor="#4A4A5A" 
              value={formData.name} 
              onChangeText={t => setFormData({...formData, name: t})} 
            />

            <View style={styles.row}>
              <View style={styles.half}>
                <Text style={styles.label}>[ STR ] MFR</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="ASUS" 
                  placeholderTextColor="#4A4A5A" 
                  value={formData.brand} 
                  onChangeText={t => setFormData({...formData, brand: t})} 
                />
              </View>
              <View style={styles.half}>
                <Text style={styles.label}>[ STR ] VRAM</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="32GB" 
                  placeholderTextColor="#4A4A5A" 
                  value={formData.vram} 
                  onChangeText={t => setFormData({...formData, vram: t})} 
                />
              </View>
            </View>

            <Text style={styles.label}>[ UID ] SERIAL_HASH</Text>
            <TextInput 
              style={styles.input} 
              placeholder="SCAN BARCODE OR INPUT HASH" 
              placeholderTextColor="#4A4A5A" 
              value={formData.serial_number} 
              onChangeText={t => setFormData({...formData, serial_number: t})} 
            />

            <View style={styles.row}>
              <View style={styles.half}>
                <Text style={styles.label}>[ INT ] CAPITAL</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="0.00" 
                  placeholderTextColor="#4A4A5A" 
                  keyboardType="numeric" 
                  value={formData.cost_price} 
                  onChangeText={t => setFormData({...formData, cost_price: t})} 
                />
              </View>
              <View style={styles.half}>
                <Text style={styles.label}>[ INT ] VALUE</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="0.00" 
                  placeholderTextColor="#4A4A5A" 
                  keyboardType="numeric" 
                  value={formData.selling_price} 
                  onChangeText={t => setFormData({...formData, selling_price: t})} 
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.half}>
                <Text style={styles.label}>[ QTY ] UNITS</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="0" 
                  placeholderTextColor="#4A4A5A" 
                  keyboardType="numeric" 
                  value={formData.stock} 
                  onChangeText={t => setFormData({...formData, stock: t})} 
                />
              </View>
              <View style={styles.half}>
                <Text style={styles.label}>[ TYP ] CLASS</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="GPU" 
                  placeholderTextColor="#4A4A5A" 
                  value={formData.category} 
                  onChangeText={t => setFormData({...formData, category: t})} 
                />
              </View>
            </View>

            <Text style={styles.label}>[ URL ] IMAGE_SRC</Text>
            <TextInput 
              style={styles.input} 
              placeholder="HTTPS://..." 
              placeholderTextColor="#4A4A5A" 
              value={formData.image} 
              onChangeText={t => setFormData({...formData, image: t})} 
            />

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.saveBtn, loading && { opacity: 0.5 }]} 
          onPress={handleSave} 
          disabled={loading}
        >
          <Text style={styles.saveBtnText}>{loading ? 'UPLOADING...' : 'PUSH TO MAINFRAME'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05050A'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: Platform.OS === 'web' ? 30 : 20,
    backgroundColor: '#0A0A10',
    borderBottomWidth: 1,
    borderBottomColor: '#FF003C'
  },
  backBtn: {
    paddingVertical: 8,
    paddingRight: 15
  },
  backText: {
    color: '#8A8A9E',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FF003C',
    letterSpacing: 4
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40
  },
  formCard: {
    backgroundColor: '#0A0A10',
    padding: 24,
    borderWidth: 1,
    borderColor: '#1E1E28',
    borderRadius: 4
  },
  label: {
    fontSize: 10,
    fontWeight: '900',
    color: '#00F0FF', // Cyber Cyan for terminal feel
    marginBottom: 10,
    marginTop: 20,
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
  },
  input: {
    backgroundColor: '#05050A',
    borderWidth: 1,
    borderColor: '#2A2A35',
    padding: 16,
    fontSize: 13,
    color: '#FFFFFF',
    outlineStyle: 'none',
    fontWeight: '800',
    letterSpacing: 1,
    borderRadius: 4
  },
  row: {
    flexDirection: 'row',
    gap: 20
  },
  half: {
    flex: 1
  },
  footer: {
    padding: 24,
    backgroundColor: '#0A0A10',
    borderTopWidth: 1,
    borderTopColor: '#1E1E28'
  },
  saveBtn: {
    backgroundColor: 'rgba(255,0,60,0.15)',
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF003C',
    borderRadius: 4,
    shadowColor: '#FF003C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10
  },
  saveBtnText: {
    color: '#FF003C',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 3
  }
});