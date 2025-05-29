<template>
  <section class="py-2 max-w-5xl mx-auto">
    <h2 class="text-xl font-semibold mb-4">หนังสือทั้งหมด</h2>
    <div
      id="book-list"
      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
    >
      <nuxt-link
        v-for="book in books"
        :key="book.id"
        :to="`/book/${book.id}`"
        class="bg-white p-4 rounded shadow hover:bg-gray-50 transition block"
      >
        <img
          :src="book.image"
          alt="Book"
          class="w-full aspect-[3/4] object-cover rounded"
        />
        <h3 class="text-lg font-semibold mt-2">{{ book.title }}</h3>

        <!-- ราคา + ปุ่ม -->
        <div class="flex items-center justify-between mt-2">
          <p class="text-red-600 font-bold text-sm">{{ book.price }}฿</p>

          <!-- ปุ่มใส่ตะกร้า -->
          <button
            @click.prevent="addToCart(book)"
            class="flex items-center gap-1 cursor-pointer bg-amber-400 hover:bg-amber-500 text-white text-xs font-semibold py-1 px-2 rounded transition relative"
            :class="{ 'bg-green-500 hover:bg-green-600': addedBooks[book.id] }"
          >
            <!-- รูปไอคอนตะกร้า -->
            <img src="/images/ตะกร้า.png" alt="ตะกร้า" class="w-6 h-6" />
            <span v-if="!addedBooks[book.id]">ใส่ตะกร้า</span>
            <span v-else class="flex items-center">
              เพิ่มแล้ว
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
      </nuxt-link>
    </div>
  </section>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useNuxtApp } from 'nuxt/app';

const router = useRouter();
const { $event } = useNuxtApp();

// สถานะสำหรับเก็บว่าสินค้าถูกเพิ่มแล้วหรือไม่
const addedBooks = ref({});

// สถานะสำหรับเก็บรายการหนังสือ
const books = ref([]);

// ดึงข้อมูลหนังสือจาก API
const fetchBooks = async () => {
  try {
    const response = await $fetch('http://localhost:3000/books');
    // ปรับโครงสร้างข้อมูลให้สอดคล้องกับ frontend
    books.value = response.map(book => ({
      ...book,
      category: book.categories?.[0]?.category?.category_name || 'ไม่ระบุ', 
    }));
  } catch (error) {
    console.error('Error fetching books:', error);
    books.value = []; 
  }
};

// เรียก API เมื่อ component ถูก mount
onMounted(() => {
  fetchBooks();
});

const addToCart = (book) => {
  if (process.client) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.loggedIn) {
      alert('กรุณาเข้าสู่ระบบก่อนเพิ่มสินค้าลงตะกร้า');
      router.push('/');
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
    addedBooks.value[book.id] = true;
    setTimeout(() => {
      addedBooks.value[book.id] = false;
    }, 500);

    // ส่ง event เพื่ออัปเดตตะกร้าใน Navbar
    $event.emit('cart-updated');
  }
};
</script>