import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';

const API_BASE = 'http://119.59.102.161:3100/api';

// ใส่ Gemini API Key ใหม่ของคุณตรงนี้
const GEMINI_API_KEY = '';

type Message = {
  id: string;
  type: 'user' | 'bot';
  text: string;
  time: string;
};

type Category = {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  questions: string[];
};

const categories: Category[] = [
  {
    id: 'product',
    icon: '📦',
    title: 'สินค้า & Stock',
    subtitle: 'ดูสินค้าและจำนวนคงเหลือ',
    questions: [
      'สินค้าอะไรหมดบ้าง?',
      'เหลือสินค้าอะไรบ้าง?',
      'สินค้าไหนใกล้หมด?',
      'ตอนนี้มีสินค้ากี่รายการ?',
      'RTX 3090 มี Stock เท่าไหร่?',
      'มีสินค้า PNY อะไรบ้าง?',
    ],
  },
  {
    id: 'price',
    icon: '💰',
    title: 'ราคา',
    subtitle: 'ค้นหาราคาและสินค้า',
    questions: [
      'มีสินค้าราคาไม่เกิน 10,000 บาทไหม?',
      'RTX 3090 ราคาเท่าไหร่?',
      'RTX 3060 ราคาเท่าไหร่?',
      'มีสินค้า PNY ราคาเท่าไหร่บ้าง?',
    ],
  },
  {
    id: 'claim',
    icon: '🔧',
    title: 'การเคลม',
    subtitle: 'ข้อมูลการเคลมสินค้า',
    questions: [
      'การเคลมสินค้าทำยังไง?',
      'อาการแบบไหนสามารถเคลมได้?',
      'ต้องใช้เอกสารอะไรในการเคลม?',
      'สามารถเปลี่ยนหรือคืนสินค้าได้ไหม?',
    ],
  },
  {
    id: 'shipping',
    icon: '🚚',
    title: 'การจัดส่ง',
    subtitle: 'ข้อมูลการจัดส่งสินค้า',
    questions: [
      'ส่งสินค้าใช้เวลากี่วัน?',
      'มี Tracking ไหม?',
      'หลังสั่งซื้อจะจัดส่งเมื่อไหร่?',
    ],
  },
];

export default function AIChat() {
  const scrollViewRef = useRef<ScrollView>(null);

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      type: 'bot',
      text:
        'สวัสดีครับ 👋\n\n' +
        'ผมคือ AI Assistant ของร้าน\n' +
        'สามารถช่วยค้นหาข้อมูลสินค้า Stock ราคา การเคลม และการจัดส่งได้ครับ\n\n' +
        'เลือกหัวข้อที่ต้องการสอบถามด้านล่างได้เลยครับ 😊',
      time: getTime(),
    },
  ]);

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({
        animated: true,
      });
    }, 100);
  }, [messages, loading]);

  function getTime() {
    return new Date().toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function addMessage(
    type: 'user' | 'bot',
    text: string
  ) {
    setMessages(prev => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        type,
        text,
        time: getTime(),
      },
    ]);
  }

  function selectCategory(id: string) {
    setSelectedCategory(prev =>
      prev === id ? null : id
    );
  }

  function selectQuestion(question: string) {
    setMessage(question);
  }

  // ============================================================
  // GET PRODUCTS
  // ============================================================

  async function getProducts() {
    try {
      const response = await fetch(
        `${API_BASE}/products`
      );

      if (!response.ok) {
        throw new Error(
          'โหลดข้อมูลสินค้าไม่สำเร็จ'
        );
      }

      return await response.json();
    } catch (error) {
      console.log('getProducts error:', error);
      return [];
    }
  }

  // ============================================================
  // SERVICE QUESTIONS
  // ============================================================

  function handleServiceQuestion(
    question: string
  ) {
    const q = question
      .toLowerCase()
      .trim();

    // การเคลม
    if (
      q.includes('เคลม') &&
      (
        q.includes('ทำยังไง') ||
        q.includes('ยังไง') ||
        q.includes('วิธี')
      )
    ) {
      return (
        '🔧 วิธีการเคลมสินค้า\n\n' +
        '1. แจ้งเลขที่คำสั่งซื้อ\n' +
        '2. แจ้งอาการของสินค้า\n' +
        '3. ส่งรูปหรือวิดีโอแสดงอาการสินค้า\n' +
        '4. เจ้าหน้าที่ตรวจสอบข้อมูล\n' +
        '5. หากเข้าเงื่อนไขการเคลม จะดำเนินการส่งสินค้าเข้าตรวจสอบ\n\n' +
        'หากต้องการสอบถามเพิ่มเติม สามารถแจ้งเลขที่คำสั่งซื้อได้ครับ 😊'
      );
    }

    // อาการเคลม
    if (
      q.includes('อาการ') &&
      (
        q.includes('เคลม') ||
        q.includes('เสีย')
      )
    ) {
      return (
        '⚠️ อาการที่ควรแจ้งเพื่อประเมินการเคลม\n\n' +
        '• สินค้าเปิดไม่ติด\n' +
        '• สินค้าทำงานผิดปกติ\n' +
        '• อุปกรณ์บางส่วนไม่ทำงาน\n' +
        '• พบปัญหาการใช้งานที่ผิดปกติ\n\n' +
        'แนะนำให้แจ้งรายละเอียดอาการ พร้อมรูปหรือวิดีโอ เพื่อให้เจ้าหน้าที่ตรวจสอบและประเมินการเคลมครับ 🔧'
      );
    }

    // เอกสาร
    if (
      q.includes('เอกสาร') &&
      q.includes('เคลม')
    ) {
      return (
        '🧾 ข้อมูลที่ควรเตรียมสำหรับการเคลม\n\n' +
        '• เลขที่คำสั่งซื้อ\n' +
        '• หลักฐานการซื้อ\n' +
        '• รายละเอียดอาการของสินค้า\n' +
        '• รูปหรือวิดีโอแสดงอาการสินค้า\n\n' +
        'เตรียมข้อมูลให้ครบจะช่วยให้เจ้าหน้าที่ตรวจสอบได้รวดเร็วขึ้นครับ 😊'
      );
    }

    // คืน / เปลี่ยน
    if (
      q.includes('คืนสินค้า') ||
      q.includes('เปลี่ยนสินค้า')
    ) {
      return (
        '🔄 การเปลี่ยนหรือคืนสินค้า\n\n' +
        'กรุณาแจ้งเลขที่คำสั่งซื้อและรายละเอียดปัญหาของสินค้า เพื่อให้เจ้าหน้าที่ตรวจสอบเงื่อนไขและดำเนินการให้ครับ\n\n' +
        'แนะนำให้ติดต่อร้านก่อนส่งสินค้ากลับครับ 😊'
      );
    }

    // Tracking
    if (
      q.includes('tracking') ||
      q.includes('เลขติดตาม')
    ) {
      return (
        '📦 Tracking สินค้า\n\n' +
        'หลังจากร้านจัดส่งสินค้าแล้ว จะมีข้อมูล Tracking สำหรับติดตามสถานะการจัดส่งครับ\n\n' +
        'สามารถใช้เลข Tracking เพื่อตรวจสอบสถานะพัสดุได้ครับ 😊'
      );
    }

    // จัดส่ง
    if (
      q.includes('ส่งสินค้า') ||
      q.includes('จัดส่ง') ||
      q.includes('กี่วัน')
    ) {
      return (
        '🚚 ระยะเวลาจัดส่ง\n\n' +
        'โดยปกติร้านใช้เวลาจัดส่งประมาณ 3–5 วันทำการครับ 📦\n\n' +
        'หลังจากจัดส่งแล้ว สามารถติดตามสถานะและเลข Tracking ตามข้อมูลที่ร้านแจ้งให้ครับ 😊'
      );
    }

    return null;
  }

  // ============================================================
  // INVENTORY QUESTIONS
  // ============================================================

  function handleInventoryQuestion(
    products: any[],
    question: string
  ) {
    const q = question
      .toLowerCase()
      .trim();

    if (!products || products.length === 0) {
      return '❌ ไม่สามารถโหลดข้อมูลสินค้าจากระบบได้ครับ';
    }

    // สินค้าหมด
    if (
      q.includes('สินค้าอะไรหมด') ||
      q.includes('หมด stock') ||
      q.includes('out of stock')
    ) {
      const outOfStock =
        products.filter(
          (product: any) =>
            Number(product.stock) === 0
        );

      if (outOfStock.length === 0) {
        return '✅ ตอนนี้ไม่มีสินค้าที่หมด Stock ครับ';
      }

      let answer =
        '📦 สินค้าที่หมด Stock\n\n';

      outOfStock.forEach(
        (product: any, index: number) => {
          answer +=
            `${index + 1}. ${product.name}\n`;

          if (product.brand) {
            answer +=
              `Brand: ${product.brand}\n`;
          }

          answer +=
            'Stock: 0 ชิ้น\n\n';
        }
      );

      answer +=
        `ทั้งหมด ${outOfStock.length} รายการครับ`;

      return answer;
    }

    // มี Stock
    if (
      q.includes('เหลือสินค้าอะไร') ||
      q.includes('มีสินค้าอะไร') ||
      q.includes('สินค้าที่มี stock') ||
      q.includes('ขายอยู่')
    ) {
      const availableProducts =
        products.filter(
          (product: any) =>
            Number(product.stock) > 0
        );

      if (availableProducts.length === 0) {
        return '❌ ตอนนี้ไม่มีสินค้าที่มี Stock ครับ';
      }

      let answer =
        '📦 สินค้าที่มี Stock อยู่ตอนนี้\n\n';

      availableProducts.forEach(
        (product: any, index: number) => {
          answer +=
            `${index + 1}. ${product.name}\n`;

          answer +=
            `Stock: ${product.stock} ชิ้น\n`;

          if (product.brand) {
            answer +=
              `Brand: ${product.brand}\n`;
          }

          const price = Number(
            product.selling_price ??
              product.price ??
              product.sellingPrice ??
              0
          );

          if (price > 0) {
            answer +=
              `ราคา: ${price.toLocaleString()} บาท\n`;
          }

          answer += '\n';
        }
      );

      return answer;
    }

    // ใกล้หมด
    if (
      q.includes('ใกล้หมด') ||
      q.includes('เหลือน้อย') ||
      q.includes('stock น้อย')
    ) {
      const lowStock =
        products.filter(
          (product: any) => {
            const stock =
              Number(product.stock);

            return (
              stock > 0 &&
              stock <= 10
            );
          }
        );

      if (lowStock.length === 0) {
        return '✅ ตอนนี้ยังไม่มีสินค้าที่ Stock ใกล้หมดครับ';
      }

      let answer =
        '⚠️ สินค้าที่ Stock เหลือน้อย\n' +
        '(ไม่เกิน 10 ชิ้น)\n\n';

      lowStock.forEach(
        (product: any, index: number) => {
          answer +=
            `${index + 1}. ${product.name}\n`;

          answer +=
            `Stock: ${product.stock} ชิ้น\n`;

          if (product.brand) {
            answer +=
              `Brand: ${product.brand}\n`;
          }

          answer += '\n';
        }
      );

      return answer;
    }

    // จำนวนสินค้า
    if (
      q.includes('มีกี่รายการ') ||
      q.includes('กี่สินค้า') ||
      q.includes('จำนวนสินค้า')
    ) {
      const total =
        products.length;

      const available =
        products.filter(
          (product: any) =>
            Number(product.stock) > 0
        ).length;

      const outOfStock =
        products.filter(
          (product: any) =>
            Number(product.stock) === 0
        ).length;

      return (
        `📊 ข้อมูลสินค้าในระบบ\n\n` +
        `• สินค้าทั้งหมด: ${total} รายการ\n` +
        `• มี Stock: ${available} รายการ\n` +
        `• หมด Stock: ${outOfStock} รายการ`
      );
    }

    // เหลือกี่รายการ
    if (
      q.includes('เหลือกี่รายการ') ||
      q.includes('เหลือกี่สินค้า') ||
      q.includes('เหลือกี่ชิ้น')
    ) {
      const available =
        products.filter(
          (product: any) =>
            Number(product.stock) > 0
        );

      return (
        `📦 ตอนนี้มีสินค้าที่มี Stock อยู่ ${available.length} รายการครับ`
      );
    }

    // ราคาไม่เกิน 10,000
    if (
      q.includes('ราคาไม่เกิน') ||
      q.includes('ไม่เกิน 10000') ||
      q.includes('ไม่เกิน 10,000')
    ) {
      const cheapProducts =
        products.filter(
          (product: any) => {
            const price = Number(
              product.selling_price ??
                product.price ??
                product.sellingPrice ??
                0
            );

            return (
              price > 0 &&
              price <= 10000
            );
          }
        );

      if (cheapProducts.length === 0) {
        return '❌ ตอนนี้ไม่มีสินค้าที่ราคาไม่เกิน 10,000 บาทครับ';
      }

      let answer =
        '💰 สินค้าที่ราคาไม่เกิน 10,000 บาท\n\n';

      cheapProducts.forEach(
        (product: any, index: number) => {
          const price = Number(
            product.selling_price ??
              product.price ??
              product.sellingPrice ??
              0
          );

          answer +=
            `${index + 1}. ${product.name}\n`;

          answer +=
            `ราคา: ${price.toLocaleString()} บาท\n`;

          answer +=
            `Stock: ${product.stock} ชิ้น\n`;

          if (product.brand) {
            answer +=
              `Brand: ${product.brand}\n`;
          }

          answer += '\n';
        }
      );

      answer +=
        `ทั้งหมด ${cheapProducts.length} รายการครับ`;

      return answer;
    }

    // ค้นหาสินค้าจากชื่อ / Brand
    let searchText = q
      .replace(/[?？]/g, '')
      .replace(/มี/g, '')
      .replace(/ไหม/g, '')
      .replace(/ครับ/g, '')
      .replace(/ค่ะ/g, '')
      .replace(/คะ/g, '')
      .replace(/stock/g, '')
      .replace(/เท่าไหร่/g, '')
      .replace(/เท่าไร/g, '')
      .replace(/ราคา/g, '')
      .replace(/ของ/g, '')
      .replace(/สินค้า/g, '')
      .replace(/อะไร/g, '')
      .replace(/บ้าง/g, '')
      .trim();

    const words =
      searchText
        .split(/\s+/)
        .filter(
          word => word.length > 0
        );

    if (words.length > 0) {
      const foundProducts =
        products.filter(
          (product: any) => {
            const name =
              String(
                product.name || ''
              ).toLowerCase();

            const brand =
              String(
                product.brand || ''
              ).toLowerCase();

            return words.every(
              word =>
                name.includes(word) ||
                brand.includes(word)
            );
          }
        );

      if (foundProducts.length > 0) {
        let answer =
          `🔎 พบสินค้า ${foundProducts.length} รายการ\n\n`;

        foundProducts.forEach(
          (product: any, index: number) => {
            const price = Number(
              product.selling_price ??
                product.price ??
                product.sellingPrice ??
                0
            );

            answer +=
              `${index + 1}. ${product.name}\n`;

            if (product.brand) {
              answer +=
                `Brand: ${product.brand}\n`;
            }

            answer +=
              `Stock: ${product.stock} ชิ้น\n`;

            if (price > 0) {
              answer +=
                `ราคา: ${price.toLocaleString()} บาท\n`;
            }

            answer += '\n';
          }
        );

        return answer;
      }
    }

    return null;
  }

  // ============================================================
  // GEMINI
  // ============================================================

  async function askGemini(
    question: string
  ) {
    if (
      !GEMINI_API_KEY ||
      GEMINI_API_KEY.includes(
        'ใส่_API_KEY'
      )
    ) {
      return '❌ ยังไม่ได้ใส่ Gemini API Key ครับ';
    }

    const prompt = `
คุณคือ AI Assistant ของแอป Inventory
สำหรับร้านขายอุปกรณ์ IT

ตอบเฉพาะเรื่อง:
- แอป Inventory
- การใช้งานระบบ
- สินค้า
- Stock
- ราคา
- การจัดการสินค้า
- การเคลม
- การจัดส่ง

ถ้าผู้ใช้ถามเรื่องที่ไม่เกี่ยวกับ Inventory
สินค้า การเคลม หรือการจัดส่ง

ให้ตอบว่า:

"ขอโทษครับ 😅 ผมสามารถตอบได้เฉพาะคำถามเกี่ยวกับแอพ Inventory และข้อมูลสินค้าเท่านั้นครับ 📦"

คำถาม:
${question}
`;

    const url =
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent';

    for (
      let attempt = 1;
      attempt <= 3;
      attempt++
    ) {
      try {
        const response =
          await fetch(url, {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',

              'x-goog-api-key':
                GEMINI_API_KEY,
            },

            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: prompt,
                    },
                  ],
                },
              ],
            }),
          });

        const data =
          await response.json();

        if (!response.ok) {
          console.log(
            'Gemini error:',
            data
          );

          if (attempt < 3) {
            await new Promise(
              resolve =>
                setTimeout(
                  resolve,
                  3000
                )
            );

            continue;
          }

          return (
            'ขอโทษครับ ตอนนี้ AI กำลังมีผู้ใช้งานจำนวนมาก ลองใหม่อีกครั้งครับ 😅'
          );
        }

        const text =
          data?.candidates?.[0]
            ?.content?.parts?.[0]
            ?.text;

        if (text) {
          return text;
        }

        return 'ขอโทษครับ ไม่สามารถสร้างคำตอบได้ในตอนนี้';
      } catch (error) {
        console.log(
          'Gemini request error:',
          error
        );

        if (attempt < 3) {
          await new Promise(
            resolve =>
              setTimeout(
                resolve,
                3000
              )
          );

          continue;
        }
      }
    }

    return '❌ เกิดข้อผิดพลาดในการเชื่อมต่อ AI ครับ';
  }

  // ============================================================
  // SEND MESSAGE
  // ============================================================

  async function sendMessage() {
    const question =
      message.trim();

    if (
      !question ||
      loading
    ) {
      return;
    }

    setMessage('');

    addMessage(
      'user',
      question
    );

    setSelectedCategory(null);

    setLoading(true);

    try {
      const serviceAnswer =
        handleServiceQuestion(
          question
        );

      if (serviceAnswer) {
        addMessage(
          'bot',
          serviceAnswer
        );

        return;
      }

      const products =
        await getProducts();

      const inventoryAnswer =
        handleInventoryQuestion(
          products,
          question
        );

      if (inventoryAnswer) {
        addMessage(
          'bot',
          inventoryAnswer
        );

        return;
      }

      const aiAnswer =
        await askGemini(
          question
        );

      addMessage(
        'bot',
        aiAnswer
      );
    } catch (error) {
      console.log(
        'sendMessage error:',
        error
      );

      addMessage(
        'bot',
        '❌ เกิดข้อผิดพลาดครับ กรุณาลองใหม่อีกครั้ง'
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // MESSAGE
  // ============================================================

  function renderMessage(
    item: Message
  ) {
    const isUser =
      item.type === 'user';

    return (
      <View
        key={item.id}
        style={[
          styles.messageRow,
          isUser &&
            styles.userMessageRow,
        ]}
      >
        {!isUser && (
          <View
            style={styles.botAvatar}
          >
            <Text
              style={
                styles.botAvatarText
              }
            >
              🤖
            </Text>
          </View>
        )}

        <View
          style={[
            styles.messageBubble,
            isUser
              ? styles.userBubble
              : styles.botBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isUser &&
                styles.userMessageText,
            ]}
          >
            {item.text}
          </Text>

          <Text
            style={[
              styles.messageTime,
              isUser &&
                styles.userMessageTime,
            ]}
          >
            {item.time}
          </Text>
        </View>
      </View>
    );
  }

  // ============================================================
  // CATEGORY
  // ============================================================

  function renderCategories() {
    return (
      <View
        style={styles.categorySection}
      >
        <View
          style={
            styles.quickTitleRow
          }
        >
          <Text
            style={
              styles.quickIcon
            }
          >
            ✨
          </Text>

          <Text
            style={
              styles.quickTitle
            }
          >
            คำถามที่พบบ่อย
          </Text>
        </View>

        <View
          style={
            styles.categoryGrid
          }
        >
          {categories.map(
            category => {
              const selected =
                selectedCategory ===
                category.id;

              return (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryCard,
                    selected &&
                      styles.categoryCardSelected,
                  ]}
                  onPress={() =>
                    selectCategory(
                      category.id
                    )
                  }
                  activeOpacity={0.85}
                >
                  <View
                    style={[
                      styles.categoryIcon,
                      selected &&
                        styles.categoryIconSelected,
                    ]}
                  >
                    <Text
                      style={
                        styles.categoryIconText
                      }
                    >
                      {
                        category.icon
                      }
                    </Text>
                  </View>

                  <Text
                    style={
                      styles.categoryTitle
                    }
                  >
                    {
                      category.title
                    }
                  </Text>

                  <Text
                    style={
                      styles.categorySubtitle
                    }
                  >
                    {
                      category.subtitle
                    }
                  </Text>

                  <Text
                    style={
                      styles.categoryArrow
                    }
                  >
                    {selected
                      ? '⌃'
                      : '›'}
                  </Text>
                </TouchableOpacity>
              );
            }
          )}
        </View>

        {selectedCategory && (
          <View
            style={
              styles.questionPanel
            }
          >
            {categories
              .filter(
                category =>
                  category.id ===
                  selectedCategory
              )
              .map(category => (
                <View
                  key={category.id}
                >
                  <View
                    style={
                      styles.panelHeader
                    }
                  >
                    <Text
                      style={
                        styles.panelIcon
                      }
                    >
                      {
                        category.icon
                      }
                    </Text>

                    <Text
                      style={
                        styles.panelTitle
                      }
                    >
                      {
                        category.title
                      }
                    </Text>
                  </View>

                  {category.questions.map(
                    (
                      question,
                      index
                    ) => (
                      <TouchableOpacity
                        key={index}
                        style={
                          styles.questionItem
                        }
                        onPress={() =>
                          selectQuestion(
                            question
                          )
                        }
                        activeOpacity={
                          0.8
                        }
                      >
                        <Text
                          style={
                            styles.questionItemText
                          }
                        >
                          {
                            question
                          }
                        </Text>

                        <Text
                          style={
                            styles.questionArrow
                          }
                        >
                          ›
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>
              ))}
          </View>
        )}
      </View>
    );
  }

  // ============================================================
  // MAIN UI
  // ============================================================

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
    >
      {/* HEADER */}

      <View
        style={styles.header}
      >
        {/* BACK HOME BUTTON */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() =>
            router.replace('/')
          }
          activeOpacity={0.8}
        >
          <Text
            style={styles.backButtonText}
          >
            ‹
          </Text>
        </TouchableOpacity>

        <View
          style={
            styles.headerAvatar
          }
        >
          <Text
            style={
              styles.headerAvatarText
            }
          >
            🤖
          </Text>
        </View>

        <View
          style={
            styles.headerInfo
          }
        >
          <Text
            style={
              styles.headerTitle
            }
          >
            AI Assistant
          </Text>

          <View
            style={
              styles.onlineRow
            }
          >
            <View
              style={
                styles.onlineDot
              }
            />

            <Text
              style={
                styles.onlineText
              }
            >
              พร้อมให้บริการ
            </Text>
          </View>
        </View>

        <View
          style={
            styles.headerBadge
          }
        >
          <Text
            style={
              styles.headerBadgeText
            }
          >
            AI
          </Text>
        </View>
      </View>

      {/* CHAT */}

      <ScrollView
        ref={scrollViewRef}
        style={styles.chatArea}
        contentContainerStyle={
          styles.chatContent
        }
        showsVerticalScrollIndicator={
          false
        }
        keyboardShouldPersistTaps="handled"
      >
        {messages.map(
          renderMessage
        )}

        {loading && (
          <View
            style={
              styles.loadingRow
            }
          >
            <View
              style={
                styles.botAvatar
              }
            >
              <Text
                style={
                  styles.botAvatarText
                }
              >
                🤖
              </Text>
            </View>

            <View
              style={
                styles.loadingBubble
              }
            >
              <ActivityIndicator
                size="small"
                color="#1677FF"
              />

              <Text
                style={
                  styles.loadingText
                }
              >
                กำลังค้นหาข้อมูล...
              </Text>
            </View>
          </View>
        )}

        {messages.length ===
          1 &&
          !loading &&
          renderCategories()}
      </ScrollView>

      {/* INPUT */}

      <View
        style={styles.inputArea}
      >
        <View
          style={
            styles.inputContainer
          }
        >
          <TouchableOpacity
            style={
              styles.attachButton
            }
            onPress={() =>
              setSelectedCategory(
                selectedCategory
                  ? null
                  : 'product'
              )
            }
          >
            <Text
              style={
                styles.attachText
              }
            >
              ＋
            </Text>
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="พิมพ์คำถามของคุณ..."
            placeholderTextColor="#94A5B8"
            value={message}
            onChangeText={
              setMessage
            }
            multiline
            maxLength={500}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              (!message.trim() ||
                loading) &&
                styles.sendButtonDisabled,
            ]}
            onPress={
              sendMessage
            }
            disabled={
              !message.trim() ||
              loading
            }
            activeOpacity={0.8}
          >
            <Text
              style={
                styles.sendText
              }
            >
              ➤
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F9FF',
  },

  // HEADER
  header: {
    height: 70,
    backgroundColor: '#FFFFFF',

    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 15,

    borderBottomWidth: 1,
    borderBottomColor: '#E5EDF7',

    shadowColor: '#6C9AC8',
    shadowOpacity: 0.07,
    shadowRadius: 7,

    shadowOffset: {
      width: 0,
      height: 2,
    },

    elevation: 3,
  },

  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EAF4FF',
    borderWidth: 1,
    borderColor: '#C6E0FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },

  backButtonText: {
    fontSize: 30,
    lineHeight: 32,
    color: '#1677FF',
    fontWeight: '500',
    marginTop: -2,
  },

  headerAvatar: {
    width: 42,
    height: 42,

    borderRadius: 21,

    backgroundColor: '#EAF4FF',

    borderWidth: 1.5,
    borderColor: '#C6E0FF',

    justifyContent: 'center',
    alignItems: 'center',
  },

  headerAvatarText: {
    fontSize: 21,
  },

  headerInfo: {
    flex: 1,
    marginLeft: 10,
  },

  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#102A43',
  },

  onlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },

  onlineDot: {
    width: 7,
    height: 7,

    borderRadius: 4,

    backgroundColor: '#22C55E',

    marginRight: 4,
  },

  onlineText: {
    fontSize: 10.5,
    color: '#6B7F93',
  },

  headerBadge: {
    width: 34,
    height: 34,

    borderRadius: 17,

    backgroundColor: '#EAF3FF',

    justifyContent: 'center',
    alignItems: 'center',
  },

  headerBadgeText: {
    color: '#1677FF',
    fontSize: 11,
    fontWeight: '800',
  },

  // CHAT
  chatArea: {
    flex: 1,
  },

  chatContent: {
    paddingHorizontal: 12,
    paddingTop: 13,
    paddingBottom: 15,
  },

  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 11,
  },

  userMessageRow: {
    justifyContent: 'flex-end',
  },

  botAvatar: {
    width: 30,
    height: 30,

    borderRadius: 15,

    backgroundColor: '#EAF4FF',

    borderWidth: 1,
    borderColor: '#C9E1FF',

    justifyContent: 'center',
    alignItems: 'center',

    marginRight: 6,
  },

  botAvatarText: {
    fontSize: 16,
  },

  messageBubble: {
    maxWidth: '82%',

    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 7,

    borderRadius: 16,
  },

  botBubble: {
    backgroundColor: '#FFFFFF',

    borderTopLeftRadius: 4,

    borderWidth: 1,
    borderColor: '#DFEAF5',

    shadowColor: '#7398BA',
    shadowOpacity: 0.06,
    shadowRadius: 5,

    shadowOffset: {
      width: 0,
      height: 2,
    },

    elevation: 1,
  },

  userBubble: {
    backgroundColor: '#1677FF',

    borderTopRightRadius: 4,

    shadowColor: '#1677FF',
    shadowOpacity: 0.14,
    shadowRadius: 5,

    shadowOffset: {
      width: 0,
      height: 2,
    },

    elevation: 2,
  },

  messageText: {
    fontSize: 12.5,
    lineHeight: 19,

    color: '#243B53',
  },

  userMessageText: {
    color: '#FFFFFF',
  },

  messageTime: {
    fontSize: 8,

    color: '#9AAABC',

    textAlign: 'right',

    marginTop: 3,
  },

  userMessageTime: {
    color: '#D8EAFF',
  },

  // LOADING
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',

    marginBottom: 12,
  },

  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: '#FFFFFF',

    borderRadius: 15,

    paddingHorizontal: 12,
    paddingVertical: 9,

    borderWidth: 1,
    borderColor: '#E0EAF5',
  },

  loadingText: {
    color: '#61758A',
    fontSize: 11,

    marginLeft: 7,
  },

  // CATEGORY
  categorySection: {
    marginTop: 2,
    marginHorizontal: 1,
  },

  quickTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',

    marginBottom: 8,
  },

  quickIcon: {
    fontSize: 15,
    marginRight: 5,
  },

  quickTitle: {
    fontSize: 13,
    fontWeight: '800',

    color: '#294763',
  },

  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',

    justifyContent: 'space-between',
  },

  categoryCard: {
    width: '48%',

    minHeight: 105,

    backgroundColor: '#FFFFFF',

    borderRadius: 15,

    padding: 11,

    marginBottom: 9,

    borderWidth: 1,
    borderColor: '#DDE9F5',

    shadowColor: '#7B9BB8',
    shadowOpacity: 0.06,
    shadowRadius: 6,

    shadowOffset: {
      width: 0,
      height: 2,
    },

    elevation: 2,
  },

  categoryCardSelected: {
    borderColor: '#83B9F5',
    backgroundColor: '#F5FAFF',
  },

  categoryIcon: {
    width: 34,
    height: 34,

    borderRadius: 10,

    backgroundColor: '#EDF6FF',

    justifyContent: 'center',
    alignItems: 'center',

    marginBottom: 6,
  },

  categoryIconSelected: {
    backgroundColor: '#DDEEFF',
  },

  categoryIconText: {
    fontSize: 18,
  },

  categoryTitle: {
    fontSize: 12.5,

    fontWeight: '800',

    color: '#193B59',
  },

  categorySubtitle: {
    fontSize: 9,

    color: '#8093A7',

    marginTop: 2,

    paddingRight: 5,
  },

  categoryArrow: {
    position: 'absolute',

    right: 9,
    bottom: 8,

    fontSize: 18,

    color: '#6B9BD1',
  },

  // QUESTION PANEL
  questionPanel: {
    backgroundColor: '#FFFFFF',

    borderRadius: 15,

    padding: 9,

    borderWidth: 1,
    borderColor: '#DDE9F5',

    marginTop: 0,
    marginBottom: 8,

    shadowColor: '#7697B7',
    shadowOpacity: 0.06,
    shadowRadius: 6,

    shadowOffset: {
      width: 0,
      height: 2,
    },

    elevation: 1,
  },

  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 4,
    paddingBottom: 7,

    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',

    marginBottom: 2,
  },

  panelIcon: {
    fontSize: 17,
    marginRight: 6,
  },

  panelTitle: {
    fontSize: 12.5,

    fontWeight: '800',

    color: '#234766',
  },

  questionItem: {
    minHeight: 39,

    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 8,

    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F8',
  },

  questionItemText: {
    flex: 1,

    fontSize: 11.5,

    color: '#315B80',

    fontWeight: '600',
  },

  questionArrow: {
    fontSize: 18,

    color: '#8AAAC6',

    marginLeft: 5,
  },

  // INPUT
  inputArea: {
    backgroundColor: '#FFFFFF',

    borderTopWidth: 1,
    borderTopColor: '#E3ECF6',

    paddingHorizontal: 10,
    paddingTop: 8,

    paddingBottom:
      Platform.OS === 'ios'
        ? 16
        : 8,
  },

  inputContainer: {
    minHeight: 48,

    borderRadius: 24,

    backgroundColor: '#F3F7FC',

    borderWidth: 1,
    borderColor: '#D9E5F1',

    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 5,
  },

  attachButton: {
    width: 35,
    height: 35,

    borderRadius: 18,

    justifyContent: 'center',
    alignItems: 'center',
  },

  attachText: {
    fontSize: 22,

    color: '#637E98',

    fontWeight: '300',
  },

  input: {
    flex: 1,

    minHeight: 38,
    maxHeight: 75,

    fontSize: 12.5,

    color: '#243B53',

    paddingHorizontal: 4,
    paddingVertical: 6,
  },

  sendButton: {
    width: 37,
    height: 37,

    borderRadius: 19,

    backgroundColor: '#1677FF',

    justifyContent: 'center',
    alignItems: 'center',

    shadowColor: '#1677FF',
    shadowOpacity: 0.22,
    shadowRadius: 5,

    shadowOffset: {
      width: 0,
      height: 2,
    },

    elevation: 2,
  },

  sendButtonDisabled: {
    backgroundColor: '#B9C9DA',

    shadowOpacity: 0,
  },

  sendText: {
    color: '#FFFFFF',

    fontSize: 17,

    fontWeight: '800',

    marginLeft: 2,
  },
});