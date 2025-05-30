<template>
  <section class="py-8 max-w-5xl mx-auto">
    <h2 class="text-xl font-semibold mb-4">หมวดหมู่ทั้งหมด</h2>
    <div class="flex flex-row gap-4">
      <nuxt-link
        v-for="category in categories"
        :key="category.id"
        :to="`/category/${category.id}`"
        class="flex items-center justify-between bg-white rounded shadow p-4 cursor-pointer hover:bg-gray-50 transition w-1/4 duration-300 transform hover:scale-105"
      >
        <span
          :class="{
            'text-red-500': $route.path === `/category/${category.id}`,
            'text-gray-800': $route.path !== `/category/${category.id}` 
          }"
        >
          {{ category.category_name }} 
        </span>
        <Icon name="mdi:chevron-right" class="text-gray-500" />
      </nuxt-link>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue';

// สถานะสำหรับเก็บหมวดหมู่
const categories = ref([]);

// ดึงข้อมูลหมวดหมู่จาก API
const fetchCategories = async () => {
  try {
    const response = await $fetch('http://localhost:3000/categories');
    categories.value = response.map(category => ({
      id: category.id,
      category_name: category.category_name, // ใช้ category_name จาก API
      // ไม่ต้องสร้าง value เพราะใช้ id แทน
    }));
  } catch (error) {
    console.error('Error fetching categories:', error);
    categories.value = [];
  }
};

// เรียก API เมื่อ component ถูก mount
onMounted(() => {
  fetchCategories();
});
</script>