<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const bookId = route.params.id;

const book = ref({
  id: null,
  title: '',
  price: 0,
  category: '',
  description: '',
});

// หมวดหมู่ที่กำหนด
const categories = ['นิยาย', 'นิยายโรแมนติก', 'การ์ตูน', 'วิชาการ', 'อื่นๆ'];

onMounted(() => {
  if (process.client) {
    const storedBooks = JSON.parse(localStorage.getItem('books') || '[]');
    if (bookId === 'new') {
      book.value.id = storedBooks.length ? Math.max(...storedBooks.map(b => b.id)) + 1 : 1;
    } else {
      const foundBook = storedBooks.find(b => b.id === parseInt(bookId));
      if (foundBook) {
        book.value = { ...foundBook };
      } else {
        router.push('/admin');
      }
    }
  }
});

const saveBook = () => {
  if (process.client) {
    const storedBooks = JSON.parse(localStorage.getItem('books') || '[]');
    if (bookId === 'new') {
      storedBooks.push({ ...book.value });
    } else {
      const index = storedBooks.findIndex(b => b.id === parseInt(bookId));
      if (index !== -1) {
        storedBooks[index] = { ...book.value };
      }
    }
    localStorage.setItem('books', JSON.stringify(storedBooks));
    router.push('/admin');
  }
};
</script>

<template>
  <div class="min-h-screen bg-gray-100 p-6">
    <div class="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow">
      <h2 class="text-2xl font-bold mb-6 text-amber-600">
        {{ bookId === 'new' ? 'เพิ่มหนังสือใหม่' : 'แก้ไขหนังสือ' }}
      </h2>
      <form @submit.prevent="saveBook">
        <div class="mb-4">
          <label class="block text-gray-700 mb-2" for="title">ชื่อหนังสือ</label>
          <input
            id="title"
            v-model="book.title"
            type="text"
            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
            required
          />
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 mb-2" for="price">ราคา</label>
          <input
            id="price"
            v-model.number="book.price"
            type="number"
            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
            required
          />
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 mb-2" for="category">หมวดหมู่</label>
          <select
            id="category"
            v-model="book.category"
            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
            required
          >
            <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
          </select>
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 mb-2" for="description">คำอธิบาย</label>
          <textarea
            id="description"
            v-model="book.description"
            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
            rows="3"
            style="max-height: 100px; overflow-y: auto;"
          ></textarea>
        </div>
        <div class="flex space-x-4">
          <button
            type="submit"
            class="bg-amber-500 text-white px-4 py-2 rounded hover:bg-amber-600 transition"
          >
            บันทึก
          </button>
          <nuxt-link
            to="/admin"
            class="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition"
          >
            ยกเลิก
          </nuxt-link>
        </div>
      </form>
    </div>
  </div>
</template>