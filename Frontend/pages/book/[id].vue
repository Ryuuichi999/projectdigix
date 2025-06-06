<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useNuxtApp } from 'nuxt/app';
import Swal from 'sweetalert2';

const route = useRoute();
const router = useRouter();
const { $event } = useNuxtApp();
const bookId = parseInt(route.params.id);

// สถานะสำหรับเก็บว่าสินค้าถูกเพิ่มแล้วหรือไม่
const isAdded = ref(false);

// สถานะสำหรับเก็บข้อมูลหนังสือ
const book = ref(null);

// ตั้งค่า SweetAlert Toast
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 1500,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  },
});

// ฟังก์ชันสำหรับฟอร์แมตวันที่
const formatDate = (dateString) => {
  if (!dateString) return 'ไม่ระบุ';
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

// ดึงข้อมูลหนังสือจาก API
const fetchBook = async () => {
  try {
    const response = await $fetch(`http://localhost:3000/books/${bookId}`);
    if (!response) {
      book.value = null;
      return;
    }
    // ปรับโครงสร้างข้อมูลให้สอดคล้องกับ frontend
    book.value = {
      ...response,
      category: response.categories?.[0]?.category?.category_name || 'ไม่ระบุ',
      stock: response.stock?.quantity ?? 0,
      publisher: response.publisher || 'ไม่ระบุ',
    };
  } catch (error) {
    console.error('Error fetching book:', error);
    book.value = null;
  }
};

// เรียก API เมื่อ component ถูก mount
onMounted(() => {
  fetchBook();
});

const addToCart = () => {
  if (process.client) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.loggedIn) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณาเข้าสู่ระบบ',
        text: 'คุณต้องเข้าสู่ระบบก่อนเพิ่มสินค้าลงตะกร้า',
        confirmButtonColor: '#f59e0b',
        confirmButtonText: 'ไปที่หน้าเข้าสู่ระบบ',
        showCancelButton: true,
        cancelButtonColor: '#d33',
        cancelButtonText: 'ยกเลิก',
      }).then((result) => {
        if (result.isConfirmed) {
          router.push('/auth/login');
        }
      });
      return;
    }

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find(item => item.id === book.value.id);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({ ...book.value, quantity: 1 });
    }
    localStorage.setItem('cart', JSON.stringify(cart));

    // อัปเดตสถานะว่าเพิ่มแล้ว
    isAdded.value = true;
    setTimeout(() => {
      isAdded.value = false;
    }, 500);

    // แสดง Toast แจ้งเตือน
    Toast.fire({
      icon: 'success',
      title: 'เพิ่มลงตะกร้าสำเร็จ',
    });

    // ส่ง event เพื่ออัปเดตตะกร้าใน Navbar
    $event.emit('cart-updated');
  }
};
</script>

<template>
  <div class="bg-amber-50 min-h-screen">
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
            <br />
            <br />
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
                📅 วันที่ตีพิมพ์: {{ formatDate(book.published) }}
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
  </div>
</template>