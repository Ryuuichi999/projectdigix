<template>
  <div class="bg-amber-50 min-h-screen">
  <section class="py-8 max-w-5xl mx-auto">
    <NuxtLink to="/" class="text-sm text-blue-500 hover:underline mb-4 block">
      ← ย้อนกลับ
    </NuxtLink>
    <h2 class="text-xl font-semibold mb-4">หมวดหมู่: {{ categoryName }}</h2>
    <div
      v-if="filteredBooks.length"
      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
    >
      <nuxt-link
        v-for="book in filteredBooks"
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
        <div class="flex items-center justify-between mt-2">
          <p class="text-red-600 font-bold text-sm">{{ book.price }}฿</p>
          <button
            class="flex items-center gap-1 bg-amber-400 hover:bg-amber-500 text-white text-xs font-semibold py-1 px-2 rounded transition"
          >
            <img src="/images/ตะกร้า.png" alt="ตะกร้า" class="w-6 h-6" />
            ใส่ตะกร้า
          </button>
        </div>
      </nuxt-link>
    </div>
    <p v-else class="text-center text-gray-500 mt-12">
      ไม่พบหนังสือในหมวดหมู่ {{ categoryName }}
    </p>
  </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useNuxtApp } from 'nuxt/app';

const route = useRoute();
const router = useRouter();
const { $event } = useNuxtApp();

// ดึง category id จาก URL
const categoryId = parseInt(route.params.id);

// สถานะสำหรับเก็บข้อมูล
const categoryName = ref('');
const filteredBooks = ref([]);

// ดึงข้อมูลหมวดหมู่จาก API
const fetchCategory = async () => {
  try {
    if (isNaN(categoryId)) {
      categoryName.value = 'ไม่ทราบหมวดหมู่';
      filteredBooks.value = [];
      return;
    }

    const response = await $fetch(`http://localhost:3000/categories/${categoryId}`);
    if (!response || !response.books) {
      categoryName.value = 'ไม่ทราบหมวดหมู่';
      filteredBooks.value = [];
      return;
    }

    // กำหนดชื่อหมวดหมู่
    categoryName.value = response.category_name || 'ไม่ทราบหมวดหมู่';

    // กำหนดรายการหนังสือ
    filteredBooks.value = response.books.map(book => ({
      ...book,
      category: response.category_name, // เพิ่ม category เพื่อให้ UI ใช้งานได้
      stock: book.stock?.quantity || 0, // ดึง quantity จาก stock
    }));
  } catch (error) {
    console.error('Error fetching category:', error);
    categoryName.value = 'ไม่ทราบหมวดหมู่';
    filteredBooks.value = [];
  }
};

// เรียก API เมื่อ component ถูก mount
onMounted(() => {
  fetchCategory();
});
</script>