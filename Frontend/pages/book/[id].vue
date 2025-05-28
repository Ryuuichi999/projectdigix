<template>
  <section class="max-w-6xl mx-auto p-6">
    <NuxtLink to="/" class="text-sm text-blue-500 hover:underline mb-4 block">
      ← ย้อนกลับ
    </NuxtLink>
    <div
      v-if="book"
      class="bg-white shadow-xl rounded-xl overflow-hidden flex flex-col md:flex-row"
    >
      <!-- รูปภาพฝั่งซ้าย -->
      <div class="md:w-1/2 bg-gray-100 flex items-center justify-center p-4">
        <img
          :src="book.image"
          alt="book image"
          class="w-full max-w-full md:max-w-md h-auto max-h-96 rounded-lg shadow-lg object-contain"
        />
      </div>

      <!-- รายละเอียดฝั่งขวา -->
      <div class="md:w-1/2 p-6 flex flex-col justify-between">
        <div class="mb-4">
          <h1 class="text-3xl font-bold mb-2 inline-flex items-center">
            {{ book.title }}
            <span class="text-sm text-gray-500 ml-5 mt-2"
              >(คงเหลือ: {{ book.stock }} เล่ม)</span
            >
          </h1>
          <br />
          <span
            class="text-sm bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full mb-2 inline-block"
            >{{ book.category }}</span
          >
          <br/>
          <br/>
          <p class="text-gray-700 mb-6">{{ book.description }}</p>
        </div>

        <div class="flex flex-col md:flex-row md:space-x-4">
          <div class="md:w-1/2">
            <p class="text-gray-600 mb-2">✍️ ผู้แต่ง: {{ book.author }}</p>
            <p class="text-gray-600 mb-2">📚 ISBN: {{ book.isbn }}</p>
          </div>
          <div class="md:w-1/2">
            <p class="text-gray-600 mb-2">
              🏢 สำนักพิมพ์: {{ book.publisher }}
            </p>
            <p class="text-gray-600 mb-2">
              📅 วันที่ตีพิมพ์: {{ book.published }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-6 mt-6">
          <p class="text-2xl font-bold text-red-600">{{ book.price }} ฿</p>
          <button
            @click="addToCart"
            class="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2 rounded-lg font-semibold shadow flex items-center cursor-pointer transition-colors duration-300 relative"
            :class="{ 'bg-green-500 hover:bg-green-600': isAdded }"
          >
            <span v-if="!isAdded">🛒 ใส่ตะกร้า</span>
            <span v-else class="flex items-center">
              🛒 เพิ่มแล้ว
              <svg
                class="w-4 h-4 ml-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </span>
          </button>
        </div>
      </div>
    </div>

    <p v-else class="text-center text-gray-500 mt-12">
      ไม่พบข้อมูลหนังสือที่คุณต้องการ
    </p>
  </section>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'; 
import { useNuxtApp } from 'nuxt/app'; 

const route = useRoute();
const router = useRouter();
const { $event } = useNuxtApp();
const bookId = parseInt(route.params.id);

// สถานะสำหรับเก็บว่าสินค้าถูกเพิ่มแล้วหรือไม่
const isAdded = ref(false);

const books = [
  {
    id: 1,
    title: "Your Name",
    price: 120,
    discount: 10,
    image: "/images/yourname.jpg",
    author: "Makoto Shinkai",
    publisher: "Kadokawa",
    isbn: "9784041026227",
    published: "2016-06-18",
    category: "นิยาย",
    stock: 8,
    description:
      "เรื่องราวของเด็กหนุ่มและเด็กสาวที่ไม่เคยพบกัน แต่จู่ ๆ ก็สลับร่างกันในฝัน เรื่องราวความรักอันเหนือจริงที่อบอวลไปด้วยกลิ่นอายแห่งโชคชะตาและเส้นเวลา",
  },
  {
    id: 2,
    title: "Doraemon",
    price: 90,
    image: "/images/Doraemon.jpg",
    author: "Fujiko F. Fujio",
    publisher: "Shogakukan",
    isbn: "9784091402511",
    published: "1970-12-01",
    category: "การ์ตูน",
    stock: 20,
    description:
      "หุ่นยนต์แมวจากโลกอนาคตกับภารกิจช่วยโนบิตะให้มีชีวิตที่ดีขึ้น ด้วยอุปกรณ์วิเศษมากมายจากกระเป๋าสี่มิติ",
  },
  {
    id: 3,
    title: "Attack on Titan",
    price: 150,
    discount: 5,
    image: "/images/Attack on Titan.jpg",
    author: "Hajime Isayama",
    publisher: "Kodansha",
    isbn: "9784063842760",
    published: "2009-09-09",
    category: "การ์ตูน",
    stock: 12,
    description:
      "โลกที่มนุษย์ต่อสู้กับยักษ์ไททันเพื่อเอาชีวิตรอด เรื่องราวแอ็กชันเข้มข้นและการต่อสู้เพื่ออิสรภาพ โดย Hajime Isayama",
  },
  {
    id: 4,
    title: "One Piece",
    price: 200,
    image: "/images/One Piece.jpg",
    author: "Eiichiro Oda",
    publisher: "Shueisha",
    isbn: "9784088725093",
    published: "1997-07-22",
    category: "การ์ตูน",
    stock: 25,
    description:
      "การเดินทางสุดตื่นเต้นของลูฟี่และลูกเรือหมวกฟางเพื่อค้นหาสมบัติ One Piece และเป็นราชาโจรสลัด โดย Eiichiro Oda",
  },
  {
    id: 5,
    title: "Naruto",
    price: 180,
    image: "/images/Naruto.jpg",
    author: "Masashi Kishimoto",
    publisher: "Shueisha",
    isbn: "9784088728407",
    published: "1999-09-21",
    category: "การ์ตูน",
    stock: 18,
    description:
      "เรื่องราวของนารูโตะหนุ่มน้อยที่ฝันจะเป็นโฮคาเงะ ผสมผสานมิตรภาพและการต่อสู้สุดมันส์ โดย Masashi Kishimoto",
  },
  {
    id: 6,
    title: "Dragon Ball",
    price: 160,
    image: "/images/Dragon Ball.jpg",
    author: "Akira Toriyama",
    publisher: "Shueisha",
    isbn: "9784088518312",
    published: "1984-11-20",
    category: "การ์ตูน",
    stock: 22,
    description:
      "การผจญภัยของโกคูเพื่อปกป้องโลกด้วยพลังซูเปอร์ไซย่าและการตามหามังกรคู่เวท โดย Akira Toriyama",
  },
  {
    id: 7,
    title: "My Hero Academia",
    price: 140,
    discount: 15,
    image: "/images/My Hero Academia.jpg",
    author: "Kohei Horikoshi",
    publisher: "Shueisha",
    isbn: "9784088802640",
    published: "2014-07-07",
    category: "การ์ตูน",
    stock: 10,
    description:
      "โลกที่ทุกคนมีพลังพิเศษ เรื่องราวของเด็กหนุ่มอิซึกุที่ฝันจะเป็นฮีโร่หมายเลขหนึ่ง โดย Kohei Horikoshi",
  },
  {
    id: 8,
    title: "Death Note",
    price: 130,
    image: "/images/Death Note.jpg",
    author: "Tsugumi Ohba",
    publisher: "Shueisha",
    isbn: "9784088736211",
    published: "2003-12-01",
    category: "การ์ตูน",
    stock: 14,
    description:
      "เกมแห่งความฉลาดระหว่างไลท์และแอล กับสมุดโน้ตที่สามารถฆ่าคนได้ โดย Tsugumi Ohba และ Takeshi Obata",
  },
  {
    id: 9,
    title: "Harry Potter",
    price: 250,
    image: "/images/Harry Potter and the Philosopher's Stone.jpg",
    author: "J.K. Rowling",
    publisher: "Bloomsbury",
    isbn: "9780747532699",
    published: "1997-06-26",
    category: "นิยาย",
    stock: 15,
    description:
      "การผจญภัยครั้งแรกของแฮร์รี่ พอตเตอร์ เด็กชายที่ค้นพบตัวเองเป็นพ่อมด และเผชิญหน้ากับลอร์ดโวลเดอมอร์ในโรงเรียนฮอกวอตส์",
  },
  {
    id: 10,
    title: "The Hobbit",
    price: 220,
    image: "/images/The Hobbit.jpg",
    author: "J.R.R. Tolkien",
    publisher: "Houghton Mifflin",
    isbn: "9780547928227",
    published: "1937-09-21",
    category: "นิยาย",
    stock: 12,
    description:
      "เรื่องราวของบิลโบ แบ๊กกินส์ ฮอบบิทที่ออกเดินทางผจญภัยเพื่อช่วยเหลือเพื่อนและค้นหาทรัพย์สมบัติกับพ่อมดคานดัลฟ์",
  },
  {
    id: 11,
    title: "Introduction to Algorithms",
    price: 800,
    image: "/images/Introduction to Algorithms.jpg",
    author: "Thomas H. Cormen",
    publisher: "MIT Press",
    isbn: "9780262033848",
    published: "2009-07-31",
    category: "วิชาการ",
    stock: 10,
    description:
      "หนังสือตำราเกี่ยวกับอัลกอริทึมที่ครอบคลุมโครงสร้างข้อมูล การวิเคราะห์ และการออกแบบ เหมาะสำหรับนักเรียนและนักพัฒนา",
  },
  {
    id: 12,
    title: "Principles of Economics",
    price: 750,
    image: "/images/Principles of Economics.jpg",
    author: "N. Gregory Mankiw",
    publisher: "Cengage",
    isbn: "9781305585126",
    published: "2014-02-26",
    category: "วิชาการ",
    stock: 8,
    description:
      "ตำราเศรษฐศาสตร์พื้นฐานที่อธิบายหลักการตลาด การเงิน และนโยบายเศรษฐกิจ เหมาะสำหรับนักศึกษาและผู้เริ่มต้น",
  },
];

const book = books.find((b) => b.id === bookId);

const addToCart = () => {
  if (process.client) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.loggedIn) {
      alert('กรุณาเข้าสู่ระบบก่อนเพิ่มสินค้าลงตะกร้า');
      router.push('/auth/login');
      return;
    }

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find(item => item.id === book.id);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({ ...book, quantity: 1 });
    }
    localStorage.setItem('cart', JSON.stringify(cart));

    // อัปเดตสถานะว่าเพิ่มแล้ว
    isAdded.value = true;
    setTimeout(() => {
      isAdded.value = false;
    }, 500); 

    // ส่ง event เพื่ออัปเดตตะกร้าใน Navbar
    $event.emit('cart-updated');
  }
};
</script>